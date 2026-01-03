import { getApiClient } from './apiClient.js'

/**
 * Утилиты для изоляции тестов
 * Обеспечивает полную изоляцию данных между тестами
 */

/**
 * Регистрирует созданную сущность для последующей очистки
 */
export class TestDataRegistry {
  constructor() {
    this.entities = {
      users: [],
      statuses: [],
      labels: [],
      tasks: [],
    }
  }

  /**
   * Регистрирует созданную сущность
   * @param {string} type - Тип сущности
   * @param {number|string} id - ID сущности
   */
  register(type, id) {
    if (this.entities[type] && !this.entities[type].includes(id)) {
      this.entities[type].push(id)
    }
  }

  /**
   * Получает все зарегистрированные сущности
   * @returns {Object} Объект с массивами ID сущностей
   */
  getAll() {
    return { ...this.entities }
  }

  /**
   * Очищает реестр
   */
  clear() {
    this.entities = {
      users: [],
      statuses: [],
      labels: [],
      tasks: [],
    }
  }
}

/**
 * Выполняет очистку всех зарегистрированных сущностей
 * @param {TestDataRegistry} registry - Реестр сущностей
 * @param {ApiClient} apiClient - API клиент
 */
export async function cleanupRegisteredEntities(registry, apiClient = null) {
  const client = apiClient || getApiClient()
  const entities = registry.getAll()

  // Удаляем в обратном порядке зависимостей
  const cleanupOrder = ['tasks', 'labels', 'statuses', 'users']

  for (const type of cleanupOrder) {
    const ids = entities[type] || []
    for (const id of ids) {
      try {
        switch (type) {
          case 'tasks':
            await client.deleteTask(id)
            break
          case 'labels':
            await client.deleteLabel(id)
            break
          case 'statuses':
            await client.deleteStatus(id)
            break
          case 'users':
            await client.deleteUser(id)
            break
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${type} ${id}:`, error.message)
      }
    }
  }

  registry.clear()
}

/**
 * Очищает состояние браузера (localStorage, cookies, sessionStorage)
 * @param {Object} page - Playwright page object
 */
export async function clearBrowserState(page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
}

/**
 * Создает изолированный контекст для теста
 * @param {Object} page - Playwright page object
 * @param {ApiClient} apiClient - API клиент
 * @returns {Object} Изолированный контекст с registry и cleanup функцией
 */
export function createIsolatedTestContext(page, apiClient = null) {
  const registry = new TestDataRegistry()
  const client = apiClient || getApiClient()

  return {
    registry,
    apiClient: client,
    cleanup: async () => {
      await cleanupRegisteredEntities(registry, client)
      await clearBrowserState(page)
    },
  }
}

/**
 * Декоратор для автоматической очистки после теста
 * @param {Function} testFn - Функция теста
 * @returns {Function} Обернутая функция теста
 */
export function withAutoCleanup(testFn) {
  return async (testInfo, ...args) => {
    const context = createIsolatedTestContext(args[0]?.page)
    try {
      await testFn(testInfo, ...args, context)
    } finally {
      await context.cleanup()
    }
  }
}

