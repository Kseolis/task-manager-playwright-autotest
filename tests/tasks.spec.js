import { test, expect } from '@playwright/test'
import { loginAsValidUser } from './helpers/authHelper.js'
import { TasksPage } from './pages/TasksPage.js'
import { UsersPage } from './pages/UsersPage.js'
import { TIMEOUTS } from './helpers/constants.js'
import { generateTaskData, generateEditedTaskData } from './helpers/testData.js'
import { TaskFactory } from './factories/TaskFactory.js'
import { UserFactory } from './factories/UserFactory.js'
import { StatusFactory } from './factories/StatusFactory.js'
import { LabelFactory } from './factories/LabelFactory.js'
import { createIsolatedTestContext } from './helpers/testIsolation.js'

test.beforeEach(async ({ page }) => {
  await loginAsValidUser(page)
})

test.afterEach(async ({ page }) => {
  // Очистка состояния браузера после каждого теста
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test.describe('Tasks: канбан-доска', () => {
  test.describe('Просмотр канбан-доски', () => {
    test('доска отображается и содержит колонки со статусами', async ({ page }) => {
      const tasksPage = new TasksPage(page)
      await tasksPage.goto()

      const statusLocators = tasksPage.getStatusColumnLocators(['Draft', 'To Review', 'To Be Fixed', 'To Publish', 'Published'])
      for (const locator of statusLocators) {
        await expect(locator).toBeVisible()
      }
    })

    test('карточка задачи содержит title и content', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)

      // Создаем задачу через Factory
      const taskData = generateTaskData()
      const task = await TaskFactory.create()
        .withTitle(taskData.title)
        .withContent(taskData.content)
        .create()
      context.registry.register('tasks', task.id)

      await tasksPage.goto()

      const card = tasksPage.getTaskCardContainerByTitle(taskData.title)
      await expect(card).toBeVisible()
      await expect(card.getByText(taskData.content, { exact: true })).toBeVisible()

      await context.cleanup()
    })
  })

  test.describe('Фильтрация задач', () => {
    test('фильтрация по исполнителю (assignee)', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)

      // Создаем пользователя и задачи
      const user1 = await UserFactory.create().withUniqueData().create()
      context.registry.register('users', user1.id)

      const user2 = await UserFactory.create().withUniqueData().create()
      context.registry.register('users', user2.id)

      const task1Data = generateTaskData()
      const task1 = await TaskFactory.create()
        .withTitle(task1Data.title)
        .withContent(task1Data.content)
        .withAssigneeId(user1.id)
        .create()
      context.registry.register('tasks', task1.id)

      const task2Data = generateTaskData()
      const task2 = await TaskFactory.create()
        .withTitle(task2Data.title)
        .withContent(task2Data.content)
        .withAssigneeId(user2.id)
        .create()
      context.registry.register('tasks', task2.id)

      await tasksPage.goto()
      await tasksPage.setFilterAssignee(user1.email)

      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task1Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task2Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(false)

      await context.cleanup()
    })

    test('фильтрация по статусу (колонке)', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)
      const apiClient = context.apiClient

      // Получаем существующие статусы или создаем новые
      let status1, status2
      try {
        const statuses = await apiClient.getStatuses()
        status1 = statuses.find(s => s.slug === 'to-be-fixed') || await StatusFactory.create().withName('To Be Fixed').withSlug('to-be-fixed').create()
        status2 = statuses.find(s => s.slug === 'draft') || await StatusFactory.create().withName('Draft').withSlug('draft').create()
      }
      catch {
        status1 = await StatusFactory.create().withName('To Be Fixed').withSlug('to-be-fixed').create()
        status2 = await StatusFactory.create().withName('Draft').withSlug('draft').create()
      }
      if (status1.id) context.registry.register('statuses', status1.id)
      if (status2.id) context.registry.register('statuses', status2.id)

      const task1Data = generateTaskData()
      const task1 = await TaskFactory.create()
        .withTitle(task1Data.title)
        .withStatusId(status1.id)
        .create()
      context.registry.register('tasks', task1.id)

      const task2Data = generateTaskData()
      const task2 = await TaskFactory.create()
        .withTitle(task2Data.title)
        .withStatusId(status2.id)
        .create()
      context.registry.register('tasks', task2.id)

      await tasksPage.goto()
      await tasksPage.setFilterStatus(status1.name)

      await expect.poll(tasksPage.getTaskInStatusColumnChecker(status1.name, task1Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task2Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(false)

      await context.cleanup()
    })

    test('фильтрация по метке (label)', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)

      // Создаем метки и задачи
      const label1 = await LabelFactory.create().withUniqueName().create()
      context.registry.register('labels', label1.id)

      const label2 = await LabelFactory.create().withUniqueName().create()
      context.registry.register('labels', label2.id)

      const task1Data = generateTaskData()
      const task1 = await TaskFactory.create()
        .withTitle(task1Data.title)
        .withLabelId(label1.id)
        .create()
      context.registry.register('tasks', task1.id)

      const task2Data = generateTaskData()
      const task2 = await TaskFactory.create()
        .withTitle(task2Data.title)
        .withLabelId(label2.id)
        .create()
      context.registry.register('tasks', task2.id)

      await tasksPage.goto()
      await tasksPage.setFilterLabel(label1.name)

      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task1Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task2Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(false)

      await context.cleanup()
    })

    test('комбинация фильтров (assignee + status)', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)
      const apiClient = context.apiClient

      // Создаем пользователей, статусы и задачи
      const user1 = await UserFactory.create().withUniqueData().create()
      context.registry.register('users', user1.id)

      const user2 = await UserFactory.create().withUniqueData().create()
      context.registry.register('users', user2.id)

      let status1, status2
      try {
        const statuses = await apiClient.getStatuses()
        status1 = statuses.find(s => s.slug === 'draft') || await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = statuses.find(s => s.slug === 'to-review') || await StatusFactory.create().withName('To Review').withSlug('to-review').create()
      }
      catch {
        status1 = await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = await StatusFactory.create().withName('To Review').withSlug('to-review').create()
      }
      if (status1.id) context.registry.register('statuses', status1.id)
      if (status2.id) context.registry.register('statuses', status2.id)

      const task1Data = generateTaskData()
      const task1 = await TaskFactory.create()
        .withTitle(task1Data.title)
        .withAssigneeId(user1.id)
        .withStatusId(status1.id)
        .create()
      context.registry.register('tasks', task1.id)

      const task2Data = generateTaskData()
      const task2 = await TaskFactory.create()
        .withTitle(task2Data.title)
        .withAssigneeId(user2.id)
        .withStatusId(status2.id)
        .create()
      context.registry.register('tasks', task2.id)

      await tasksPage.goto()
      await tasksPage.setFilters({ assignee: user1.email, status: status1.name })

      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task1Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect.poll(tasksPage.getTaskCardVisibilityChecker(task2Data.title), { timeout: TIMEOUTS.MEDIUM }).toBe(false)

      await context.cleanup()
    })
  })

  test.describe('Перемещение задач (drag&drop)', () => {
    test('перемещение карточки между колонками и сохранение в рамках SPA', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)
      const apiClient = context.apiClient

      // Создаем статусы и задачу
      let status1, status2
      try {
        const statuses = await apiClient.getStatuses()
        status1 = statuses.find(s => s.slug === 'draft') || await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = statuses.find(s => s.slug === 'to-review') || await StatusFactory.create().withName('To Review').withSlug('to-review').create()
      }
      catch {
        status1 = await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = await StatusFactory.create().withName('To Review').withSlug('to-review').create()
      }
      if (status1.id) context.registry.register('statuses', status1.id)
      if (status2.id) context.registry.register('statuses', status2.id)

      const taskData = generateTaskData()
      const task = await TaskFactory.create()
        .withTitle(taskData.title)
        .withStatusId(status1.id)
        .create()
      context.registry.register('tasks', task.id)

      await tasksPage.goto()
      await expect.poll(tasksPage.getTaskInStatusColumnChecker(status1.name, taskData.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

      await tasksPage.dragTaskToStatus(taskData.title, status2.name)

      await expect.poll(tasksPage.getTaskInStatusColumnChecker(status2.name, taskData.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect.poll(tasksPage.getTaskInStatusColumnChecker(status1.name, taskData.title), { timeout: TIMEOUTS.MEDIUM }).toBe(false)

      const usersPage = new UsersPage(page)
      await usersPage.goto()
      await expect(usersPage.getTableLocator()).toBeVisible()

      await tasksPage.goto()
      await expect.poll(tasksPage.getTaskInStatusColumnChecker(status2.name, taskData.title), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

      await context.cleanup()
    })
  })

  test.describe('Создание задач', () => {
    test('форма создания задачи отображается корректно и валидирует обязательные поля', async ({ page }) => {
      const tasksPage = new TasksPage(page)
      await tasksPage.openCreateForm()

      await expect(tasksPage.getTitleInput()).toBeVisible()
      await expect(tasksPage.getContentInput()).toBeVisible()

      const saveButton = tasksPage.getSaveButton()
      await expect(saveButton).toBeVisible()
      await expect(saveButton).toBeDisabled()

      const taskData = generateTaskData()
      await tasksPage.fillTaskForm({ title: taskData.title })
      await expect(saveButton).toBeEnabled()
    })

    test('создание задачи с валидными данными', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)
      const apiClient = context.apiClient

      // Создаем пользователя, статус и метку
      const user = await UserFactory.create().withUniqueData().create()
      context.registry.register('users', user.id)

      let status
      try {
        const statuses = await apiClient.getStatuses()
        status = statuses.find(s => s.slug === 'draft') || await StatusFactory.create().withName('Draft').withSlug('draft').create()
      }
      catch {
        status = await StatusFactory.create().withName('Draft').withSlug('draft').create()
      }
      if (status.id) context.registry.register('statuses', status.id)

      const label = await LabelFactory.create().withUniqueName().create()
      context.registry.register('labels', label.id)

      const taskData = generateTaskData()

      await tasksPage.createTaskWithOptions(taskData, {
        assignee: user.email,
        status: status.name,
        labels: [label.name],
      })

      await expect.poll(
        tasksPage.getTaskInStatusColumnChecker(status.name, taskData.title),
        { timeout: TIMEOUTS.LONG },
      ).toBe(true)

      await context.cleanup()
    })
  })

  test.describe('Редактирование задач', () => {
    test('изменение данных задачи сохраняется корректно', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)
      const apiClient = context.apiClient

      // Создаем статусы и задачу
      let status1, status2
      try {
        const statuses = await apiClient.getStatuses()
        status1 = statuses.find(s => s.slug === 'draft') || await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = statuses.find(s => s.slug === 'to-publish') || await StatusFactory.create().withName('To Publish').withSlug('to-publish').create()
      }
      catch {
        status1 = await StatusFactory.create().withName('Draft').withSlug('draft').create()
        status2 = await StatusFactory.create().withName('To Publish').withSlug('to-publish').create()
      }
      if (status1.id) context.registry.register('statuses', status1.id)
      if (status2.id) context.registry.register('statuses', status2.id)

      const taskData = generateTaskData()
      const task = await TaskFactory.create()
        .withTitle(taskData.title)
        .withContent(taskData.content)
        .withStatusId(status1.id)
        .create()
      context.registry.register('tasks', task.id)

      const edited = generateEditedTaskData()

      await tasksPage.goto()
      await tasksPage.openTaskEditFromCard(taskData.title)
      await tasksPage.fillTaskForm(edited)
      await tasksPage.setFormStatus(status2.name)
      await tasksPage.saveTask()

      await tasksPage.goto()
      await expect.poll(
        tasksPage.getTaskInStatusColumnChecker(status2.name, edited.title),
        { timeout: TIMEOUTS.LONG },
      ).toBe(true)

      await context.cleanup()
    })
  })

  test.describe('Просмотр карточки задачи', () => {
    test('страница Show открывается из карточки', async ({ page }) => {
      const context = createIsolatedTestContext(page)
      const tasksPage = new TasksPage(page)

      // Создаем задачу
      const taskData = generateTaskData()
      const task = await TaskFactory.create()
        .withTitle(taskData.title)
        .withContent(taskData.content)
        .create()
      context.registry.register('tasks', task.id)

      await tasksPage.goto()
      await tasksPage.openTaskShowFromCard(taskData.title)

      await expect.poll(() => tasksPage.isTaskShowPage(task.id), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect(tasksPage.getTaskShowText(taskData.title)).toBeVisible()
      await expect(tasksPage.getTaskShowText(taskData.content)).toBeVisible()

      await context.cleanup()
    })
  })
})
