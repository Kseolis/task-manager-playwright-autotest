import { test, expect } from '@playwright/test'
import { getApiClient } from '../../../helpers/apiClient.js'
import { UserFactory } from '../../../factories/UserFactory.js'
import { StatusFactory } from '../../../factories/StatusFactory.js'
import { LabelFactory } from '../../../factories/LabelFactory.js'
import { TaskFactory } from '../../../factories/TaskFactory.js'
import { testUsers } from '../../../helpers/testData.js'

/**
 * Integration тесты для критичных workflows
 * Проверяют бизнес-логику через API без UI
 */
test.describe('Task Workflow Integration', () => {
  let apiClient
  const createdEntities = {
    users: [],
    statuses: [],
    labels: [],
    tasks: [],
  }

  test.beforeEach(async () => {
    apiClient = getApiClient()
    try {
      await apiClient.login(testUsers.valid.login, testUsers.valid.password)
    }
    catch {
      // Игнорируем ошибки авторизации
    }
  })

  test.afterEach(async () => {
    // Очистка созданных сущностей
    for (const taskId of createdEntities.tasks) {
      try {
        await apiClient.deleteTask(taskId)
      }
      catch {
        // Игнорируем
      }
    }
    for (const labelId of createdEntities.labels) {
      try {
        await apiClient.deleteLabel(labelId)
      }
      catch {
        // Игнорируем
      }
    }
    for (const statusId of createdEntities.statuses) {
      try {
        await apiClient.deleteStatus(statusId)
      }
      catch {
        // Игноруем
      }
    }
    for (const userId of createdEntities.users) {
      try {
        await apiClient.deleteUser(userId)
      }
      catch {
        // Игнорируем
      }
    }

    // Очищаем массивы
    Object.keys(createdEntities).forEach((key) => {
      createdEntities[key] = []
    })
  })

  test('полный workflow создания задачи с зависимостями', async () => {
    // 1. Создаем пользователя
    const user = await UserFactory.create().withUniqueData().create()
    createdEntities.users.push(user.id)

    // 2. Создаем статус
    const status = await StatusFactory.create().withUniqueData().create()
    createdEntities.statuses.push(status.id)

    // 3. Создаем метку
    const label = await LabelFactory.create().withUniqueName().create()
    createdEntities.labels.push(label.id)

    // 4. Создаем задачу со всеми зависимостями
    const task = await TaskFactory.create()
      .withTitle('Integration Test Task')
      .withContent('Test workflow')
      .withAssigneeId(user.id)
      .withStatusId(status.id)
      .withLabelId(label.id)
      .create()

    createdEntities.tasks.push(task.id)

    // 5. Проверяем, что задача создана с правильными данными
    const retrievedTask = await apiClient.getTask(task.id)
    expect(retrievedTask.title).toBe('Integration Test Task')
    expect(retrievedTask.assignee_id).toBe(user.id)
    expect(retrievedTask.status_id).toBe(status.id)
    expect(retrievedTask.label_ids).toContain(label.id)
  })

  test('workflow изменения статуса задачи', async () => {
    // Создаем задачу
    const task = await TaskFactory.create().withUniqueData().create()
    createdEntities.tasks.push(task.id)

    // Создаем два статуса
    const status1 = await StatusFactory.create().withUniqueData().create()
    const status2 = await StatusFactory.create().withUniqueData().create()
    createdEntities.statuses.push(status1.id, status2.id)

    // Устанавливаем первый статус
    await apiClient.updateTask(task.id, { status_id: status1.id })
    let updatedTask = await apiClient.getTask(task.id)
    expect(updatedTask.status_id).toBe(status1.id)

    // Меняем на второй статус
    await apiClient.updateTask(task.id, { status_id: status2.id })
    updatedTask = await apiClient.getTask(task.id)
    expect(updatedTask.status_id).toBe(status2.id)
  })

  test('workflow добавления меток к задаче', async () => {
    // Создаем задачу
    const task = await TaskFactory.create().withUniqueData().create()
    createdEntities.tasks.push(task.id)

    // Создаем метки
    const label1 = await LabelFactory.create().withUniqueName().create()
    const label2 = await LabelFactory.create().withUniqueName().create()
    createdEntities.labels.push(label1.id, label2.id)

    // Добавляем первую метку
    await apiClient.updateTask(task.id, { label_ids: [label1.id] })
    let updatedTask = await apiClient.getTask(task.id)
    expect(updatedTask.label_ids).toContain(label1.id)

    // Добавляем вторую метку
    await apiClient.updateTask(task.id, { label_ids: [label1.id, label2.id] })
    updatedTask = await apiClient.getTask(task.id)
    expect(updatedTask.label_ids).toContain(label1.id)
    expect(updatedTask.label_ids).toContain(label2.id)
  })
})
