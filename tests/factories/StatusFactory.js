import { getApiClient } from '../helpers/apiClient.js'

/**
 * Factory для создания статусов
 * Использует Builder Pattern для гибкого создания тестовых данных
 */
export class StatusFactory {
  constructor() {
    this.data = {
      name: null,
      slug: null,
    }
    this.apiClient = getApiClient()
  }

  /**
   * Создает новый экземпляр фабрики
   * @returns {StatusFactory} Новый экземпляр фабрики
   */
  static create() {
    return new StatusFactory()
  }

  /**
   * Устанавливает название статуса
   * @param {string} name - Название статуса
   * @returns {StatusFactory} Текущий экземпляр для цепочки вызовов
   */
  withName(name) {
    this.data.name = name
    return this
  }

  /**
   * Устанавливает slug статуса
   * @param {string} slug - Slug статуса
   * @returns {StatusFactory} Текущий экземпляр для цепочки вызовов
   */
  withSlug(slug) {
    this.data.slug = slug
    return this
  }

  /**
   * Генерирует уникальные данные статуса на основе timestamp
   * @returns {StatusFactory} Текущий экземпляр для цепочки вызовов
   */
  withUniqueData() {
    const timestamp = Date.now()
    this.data.name = `Test Status ${timestamp}`
    this.data.slug = `test-status-${timestamp}`
    return this
  }

  /**
   * Генерирует slug из name, если slug не установлен
   * @returns {StatusFactory} Текущий экземпляр для цепочки вызовов
   */
  withAutoSlug() {
    if (this.data.name && !this.data.slug) {
      this.data.slug = this.data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }
    return this
  }

  /**
   * Возвращает данные статуса без создания в системе
   * @returns {Object} Данные статуса
   */
  build() {
    if (!this.data.name) {
      this.withUniqueData()
    }
    if (!this.data.slug) {
      this.withAutoSlug()
    }
    return { ...this.data }
  }

  /**
   * Создает статус в системе через API
   * @returns {Promise<Object>} Созданный статус
   */
  async create() {
    const statusData = this.build()
    const status = await this.apiClient.createStatus(statusData)
    return status
  }

  /**
   * Создает статус и возвращает его данные
   * @returns {Promise<Object>} Данные созданного статуса
   */
  async createAndGet() {
    const status = await this.create()
    return {
      id: status.id,
      name: status.name,
      slug: status.slug,
    }
  }
}

/**
 * Быстрый способ создать статус с уникальными данными
 * @returns {Promise<Object>} Созданный статус
 */
export async function createTestStatus() {
  return StatusFactory.create().withUniqueData().create()
}

/**
 * Быстрый способ создать статус с указанным slug
 * @param {string} slug - Slug статуса
 * @returns {Promise<Object>} Созданный статус
 */
export async function createTestStatusWithSlug(slug) {
  return StatusFactory.create().withSlug(slug).withUniqueData().create()
}

