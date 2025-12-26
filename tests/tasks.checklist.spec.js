import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { loginAsValidUser } from './helpers/authHelper.js'
import { TasksPage } from './pages/TasksPage.js'
import { UsersPage } from './pages/UsersPage.js'
import { URLS, TIMEOUTS } from './helpers/constants.js'

test.describe('Tasks: чеклист-дополнения', () => {
  test('без авторизации переход на Tasks приводит к форме логина', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await page.goto(URLS.TASKS)
    await expect.poll(() => loginPage.isLoginFormVisible(), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
  })

  test.describe('Авторизованные тесты', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsValidUser(page)
    })

    test('переход на Tasks через меню', async ({ page }) => {
      const tasksPage = new TasksPage(page)
      const usersPage = new UsersPage(page)

      await usersPage.goto()
      await expect(usersPage.getTableLocator()).toBeVisible()

      await tasksPage.openFromMenu()
      await expect.poll(() => page.url().includes('/#/tasks'), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
    })

    test('выбранные фильтры сохраняются после перезагрузки страницы', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()
      await expect(tasksPage.getTaskCardContainerByTitle('Task 2')).toBeVisible()

      await tasksPage.setFilterStatus('To Be Fixed')
      await expect.poll(
        () => tasksPage.getTaskCardContainerByTitle('Task 2').isVisible().catch(() => false),
        { timeout: TIMEOUTS.MEDIUM },
      ).toBe(false)

      await page.reload()
      await tasksPage.goto()

      await expect(tasksPage.getFilterStatusLocator('To Be Fixed')).toBeVisible()
      await expect.poll(
        () => tasksPage.getTaskCardContainerByTitle('Task 2').isVisible().catch(() => false),
        { timeout: TIMEOUTS.MEDIUM },
      ).toBe(false)
      await expect.poll(
        () => tasksPage.getTaskCardContainerByTitle('Task 1').isVisible().catch(() => false),
        { timeout: TIMEOUTS.MEDIUM },
      ).toBe(true)
    })

    test('drag&drop внутри одной колонки меняет порядок карточек', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()

      const before = await tasksPage.getTaskButtonNamesInColumn('Draft')
      const beforeTask11Index = before.findIndex(t => t.includes('Task 11'))
      const beforeTask5Index = before.findIndex(t => t.includes('Task 5'))
      await expect.soft(beforeTask11Index).toBeGreaterThanOrEqual(0)
      await expect.soft(beforeTask5Index).toBeGreaterThanOrEqual(0)
      await expect(beforeTask11Index).toBeLessThan(beforeTask5Index)

      await tasksPage.dragTaskToTask('Task 5', 'Task 11')

      await expect.poll(async () => {
        const after = await tasksPage.getTaskButtonNamesInColumn('Draft')
        const afterTask11Index = after.findIndex(t => t.includes('Task 11'))
        const afterTask5Index = after.findIndex(t => t.includes('Task 5'))
        return afterTask5Index !== -1 && afterTask11Index !== -1 && afterTask5Index < afterTask11Index
      }, { timeout: TIMEOUTS.MEDIUM }).toBe(true)
    })

    test('дроп вне колонок не меняет статус карточки', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()
      await expect.poll(() => tasksPage.isTaskVisibleInStatusColumn('Draft', 'Task 5'), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

      await tasksPage.dragTaskToCoordinates('Task 5', 5, 5)

      await expect.poll(() => tasksPage.isTaskVisibleInStatusColumn('Draft', 'Task 5'), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
    })

    test('Create: обязательные поля Assignee/Status не дают сохранить (валидация при submit)', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.openCreateForm()

      await tasksPage.fillTaskForm({ title: 'Task validation check' })

      const saveButton = tasksPage.getSaveButton()
      await expect(saveButton).toBeEnabled()
      await saveButton.click()

      await expect.poll(() => tasksPage.isTaskCreatePage(), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect(tasksPage.getTitleInput()).toHaveValue('Task validation check')
    })

    test('Edit: изменение assignee и labels отражается на странице Show', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()
      await tasksPage.openTaskEditFromCard('Task 3')

      await tasksPage.setFormAssignee('john@google.com')
      await tasksPage.setFormLabels(['task'])
      await tasksPage.saveTask()

      await tasksPage.goto()
      await tasksPage.openTaskShowFromCard('Task 3')

      await expect(tasksPage.getTaskShowText('john@google.com')).toBeVisible()
      await expect(tasksPage.getTaskShowLink('task')).toBeVisible()
    })

    test('Show: отображаются id/createdAt/assignee/labels (на примере Task 7)', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()
      await tasksPage.openTaskShowFromCard('Task 7')

      await expect.poll(() => tasksPage.isTaskShowPage(7), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
      await expect(tasksPage.getTaskShowText('7')).toBeVisible()
      await expect(page.getByText(/2023/)).toBeVisible()
      await expect(tasksPage.getTaskShowText('jane@gmail.com')).toBeVisible()
      await expect(tasksPage.getTaskShowLink('bug')).toBeVisible()
    })

    test('Export: по кнопке Export начинается загрузка файла', async ({ page }) => {
      const tasksPage = new TasksPage(page)

      await tasksPage.goto()

      const downloadPromise = page.waitForEvent('download', { timeout: TIMEOUTS.MEDIUM })
      await tasksPage.getExportButton().click()
      const download = await downloadPromise

      await expect(download.suggestedFilename().length).toBeGreaterThan(0)
    })
  })
})
