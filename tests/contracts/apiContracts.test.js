import { test, expect } from '@playwright/test'
import { getApiClient } from '../../helpers/apiClient.js'
import { testUsers } from '../../helpers/testData.js'

/**
 * Contract Testing - проверка контрактов API
 * Валидация структуры ответов API
 */
test.describe('API Contracts', () => {
  let apiClient

  test.beforeEach(async () => {
    apiClient = getApiClient()
    try {
      await apiClient.login(testUsers.valid.login, testUsers.valid.password)
    } catch (error) {
      // Игнорируем
    }
  })

  test.describe('User Contract', () => {
    test('ответ getUsers содержит массив пользователей с правильной структурой', async () => {
      const users = await apiClient.getUsers()
      expect(Array.isArray(users)).toBe(true)

      if (users.length > 0) {
        const user = users[0]
        // Проверяем обязательные поля
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(typeof user.id).toBe('number')
        expect(typeof user.email).toBe('string')
      }
    })

    test('ответ createUser возвращает созданного пользователя', async () => {
      const userData = {
        email: `contract${Date.now()}@example.com`,
        firstName: 'Contract',
        lastName: 'Test',
      }

      const user = await apiClient.createUser(userData)

      // Проверяем контракт
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('firstName')
      expect(user).toHaveProperty('lastName')
      expect(user.email).toBe(userData.email)

      // Очистка
      try {
        await apiClient.deleteUser(user.id)
      } catch (error) {
        // Игнорируем
      }
    })
  })

  test.describe('Task Contract', () => {
    test('ответ getTasks содержит массив задач с правильной структурой', async () => {
      const tasks = await apiClient.getTasks()
      expect(Array.isArray(tasks)).toBe(true)

      if (tasks.length > 0) {
        const task = tasks[0]
        // Проверяем обязательные поля
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('title')
        expect(typeof task.id).toBe('number')
        expect(typeof task.title).toBe('string')
      }
    })

    test('ответ createTask возвращает созданную задачу', async () => {
      const taskData = {
        title: `Contract Task ${Date.now()}`,
        content: 'Contract test',
      }

      const task = await apiClient.createTask(taskData)

      // Проверяем контракт
      expect(task).toHaveProperty('id')
      expect(task).toHaveProperty('title')
      expect(task).toHaveProperty('content')
      expect(task.title).toBe(taskData.title)

      // Очистка
      try {
        await apiClient.deleteTask(task.id)
      } catch (error) {
        // Игнорируем
      }
    })
  })

  test.describe('Status Contract', () => {
    test('ответ getStatuses содержит массив статусов с правильной структурой', async () => {
      const statuses = await apiClient.getStatuses()
      expect(Array.isArray(statuses)).toBe(true)

      if (statuses.length > 0) {
        const status = statuses[0]
        expect(status).toHaveProperty('id')
        expect(status).toHaveProperty('name')
        expect(status).toHaveProperty('slug')
      }
    })
  })

  test.describe('Label Contract', () => {
    test('ответ getLabels содержит массив меток с правильной структурой', async () => {
      const labels = await apiClient.getLabels()
      expect(Array.isArray(labels)).toBe(true)

      if (labels.length > 0) {
        const label = labels[0]
        expect(label).toHaveProperty('id')
        expect(label).toHaveProperty('name')
      }
    })
  })
})

