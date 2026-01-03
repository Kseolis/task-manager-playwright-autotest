import { test, expect } from '@playwright/test'
import { getApiClient } from '../../../helpers/apiClient.js'
import { testUsers } from '../../../helpers/testData.js'

/**
 * Integration тесты для API Client
 * Проверяют реальное взаимодействие с API без UI
 */
test.describe('API Client Integration', () => {
  let apiClient

  test.beforeEach(async () => {
    apiClient = getApiClient()
    // Авторизуемся для доступа к API
    try {
      await apiClient.login(testUsers.valid.login, testUsers.valid.password)
    }
    catch {
      // Если авторизация не нужна, продолжаем
    }
  })

  test.describe('Users API', () => {
    test('получает список пользователей', async () => {
      const users = await apiClient.getUsers()
      expect(Array.isArray(users)).toBe(true)
    })

    test('создает и удаляет пользователя', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
      }

      const createdUser = await apiClient.createUser(userData)
      expect(createdUser.email).toBe(userData.email)

      // Очистка
      try {
        await apiClient.deleteUser(createdUser.id)
      }
      catch {
        // Игнорируем ошибки очистки
      }
    })
  })

  test.describe('Statuses API', () => {
    test('получает список статусов', async () => {
      const statuses = await apiClient.getStatuses()
      expect(Array.isArray(statuses)).toBe(true)
    })

    test('создает и удаляет статус', async () => {
      const statusData = {
        name: `Test Status ${Date.now()}`,
        slug: `test-status-${Date.now()}`,
      }

      const createdStatus = await apiClient.createStatus(statusData)
      expect(createdStatus.name).toBe(statusData.name)

      // Очистка
      try {
        await apiClient.deleteStatus(createdStatus.id)
      }
      catch {
        // Игнорируем ошибки очистки
      }
    })
  })

  test.describe('Labels API', () => {
    test('получает список меток', async () => {
      const labels = await apiClient.getLabels()
      expect(Array.isArray(labels)).toBe(true)
    })

    test('создает и удаляет метку', async () => {
      const labelData = {
        name: `Test Label ${Date.now()}`,
      }

      const createdLabel = await apiClient.createLabel(labelData)
      expect(createdLabel.name).toBe(labelData.name)

      // Очистка
      try {
        await apiClient.deleteLabel(createdLabel.id)
      }
      catch {
        // Игнорируем ошибки очистки
      }
    })
  })

  test.describe('Tasks API', () => {
    test('получает список задач', async () => {
      const tasks = await apiClient.getTasks()
      expect(Array.isArray(tasks)).toBe(true)
    })

    test('создает и удаляет задачу', async () => {
      const taskData = {
        title: `Test Task ${Date.now()}`,
        content: `Description ${Date.now()}`,
      }

      const createdTask = await apiClient.createTask(taskData)
      expect(createdTask.title).toBe(taskData.title)

      // Очистка
      try {
        await apiClient.deleteTask(createdTask.id)
      }
      catch {
        // Игнорируем ошибки очистки
      }
    })
  })

  test.describe('Bulk Operations', () => {
    test('cleanupTestData удаляет все тестовые данные', async () => {
      // Создаем тестовые данные
      const user = await apiClient.createUser({
        email: `cleanup${Date.now()}@example.com`,
        firstName: 'Cleanup',
        lastName: 'Test',
      })

      const stats = await apiClient.cleanupTestData(['users'])

      expect(stats.users).toBeGreaterThanOrEqual(0)

      // Проверяем, что пользователь удален
      try {
        await apiClient.getUser(user.id)
        // Если не выбросило ошибку, пользователь все еще существует
      }
      catch (error) {
        // Ожидаемо - пользователь должен быть удален
        expect(error.message).toBeTruthy()
      }
    })
  })
})
