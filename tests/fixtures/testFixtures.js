import { test as base } from '@playwright/test'
import { createApiClient } from '../helpers/apiClient.js'
import { testUsers } from '../helpers/testData.js'

/**
 * Расширенные fixtures для тестов
 * Добавляет автоматическую очистку данных и переиспользование сессий
 */

/**
 * Расширенный контекст теста с API клиентом и автоматической очисткой
 */
export const test = base.extend({
  /**
   * API клиент для управления тестовыми данными
   */
  apiClient: async ({}, use) => {
    const client = createApiClient()
    await use(client)
  },

  /**
   * Автоматическая очистка созданных сущностей после теста
   */
  autoCleanup: async ({ apiClient }, use, testInfo) => {
    const createdEntities = {
      users: [],
      statuses: [],
      labels: [],
      tasks: [],
    }

    // Передаем функцию для регистрации созданных сущностей
    const registerEntity = (type, id) => {
      if (createdEntities[type] && !createdEntities[type].includes(id)) {
        createdEntities[type].push(id)
      }
    }

    await use(registerEntity)

    // ENFORCED CLEANUP: Автоматическая очистка после теста (всегда выполняется)
    // Не зависит от статуса теста - cleanup обязателен для изоляции
    if (testInfo.status === 'passed' || testInfo.status === 'failed' || testInfo.status === 'skipped') {
      // Удаляем в обратном порядке зависимостей (tasks -> labels -> statuses -> users)
      for (const taskId of createdEntities.tasks) {
        try {
          await apiClient.deleteTask(taskId)
        }
        catch (_error) {
          console.warn(`Failed to cleanup task ${taskId}:`, error.message)
        }
      }

      for (const labelId of createdEntities.labels) {
        try {
          await apiClient.deleteLabel(labelId)
        }
        catch (_error) {
          console.warn(`Failed to cleanup label ${labelId}:`, error.message)
        }
      }

      for (const statusId of createdEntities.statuses) {
        try {
          await apiClient.deleteStatus(statusId)
        }
        catch (_error) {
          console.warn(`Failed to cleanup status ${statusId}:`, error.message)
        }
      }

      for (const userId of createdEntities.users) {
        try {
          await apiClient.deleteUser(userId)
        }
        catch (_error) {
          console.warn(`Failed to cleanup user ${userId}:`, error.message)
        }
      }
    }
  },

  /**
   * Авторизованный пользователь с сохраненной сессией
   */
  authenticatedPage: async ({ page, apiClient }, use) => {
    // Авторизуемся через API
    const loginResponse = await apiClient.login(
      testUsers.valid.login,
      testUsers.valid.password,
    )

    // Сохраняем состояние авторизации
    await page.context().addCookies([
      {
        name: 'session',
        value: loginResponse.token || 'authenticated',
        domain: new URL(process.env.BASE_URL || 'http://localhost:5173').hostname,
        path: '/',
      },
    ])

    await use(page)
  },
})

/**
 * Fixture для создания тестовых данных с автоматической очисткой
 */
export const testWithData = base.extend({
  /**
   * Создает пользователя и автоматически удаляет после теста
   */
  testUser: async ({ apiClient, autoCleanup }, use) => {
    const user = await apiClient.createUser({
      email: `test${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    })
    autoCleanup('users', user.id)

    await use(user)

    // Дополнительная очистка на случай, если autoCleanup не сработал
    try {
      await apiClient.deleteUser(user.id)
    }
    catch (_error) {
      // Игнорируем ошибки, если уже удалено
    }
  },

  /**
   * Создает статус и автоматически удаляет после теста
   */
  testStatus: async ({ apiClient, autoCleanup }, use) => {
    const status = await apiClient.createStatus({
      name: `Test Status ${Date.now()}`,
      slug: `test-status-${Date.now()}`,
    })
    autoCleanup('statuses', status.id)

    await use(status)

    try {
      await apiClient.deleteStatus(status.id)
    }
    catch (_error) {
      // Игнорируем ошибки
    }
  },

  /**
   * Создает метку и автоматически удаляет после теста
   */
  testLabel: async ({ apiClient, autoCleanup }, use) => {
    const label = await apiClient.createLabel({
      name: `Test Label ${Date.now()}`,
    })
    autoCleanup('labels', label.id)

    await use(label)

    try {
      await apiClient.deleteLabel(label.id)
    }
    catch (_error) {
      // Игнорируем ошибки
    }
  },

  /**
   * Создает задачу и автоматически удаляет после теста
   */
  testTask: async ({ apiClient, autoCleanup }, use) => {
    const task = await apiClient.createTask({
      title: `Test Task ${Date.now()}`,
      content: `Description ${Date.now()}`,
    })
    autoCleanup('tasks', task.id)

    await use(task)

    try {
      await apiClient.deleteTask(task.id)
    }
    catch (_error) {
      // Игнорируем ошибки
    }
  },
})

/**
 * Helper для создания storage state для переиспользования сессий
 */
export async function createAuthStorageState(page, username, password) {
  const apiClient = createApiClient()
  const loginResponse = await apiClient.login(username, password)

  // Сохраняем cookies
  await page.goto(process.env.BASE_URL || 'http://localhost:5173')
  await page.context().addCookies([
    {
      name: 'session',
      value: loginResponse.token || 'authenticated',
      domain: new URL(process.env.BASE_URL || 'http://localhost:5173').hostname,
      path: '/',
    },
  ])

  // Сохраняем storage state
  await page.context().storageState({ path: 'tests/fixtures/auth.json' })
}
