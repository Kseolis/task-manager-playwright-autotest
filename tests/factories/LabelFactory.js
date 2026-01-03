import { getApiClient } from '../helpers/apiClient.js'

/**
 * Factory для создания меток
 * Использует Builder Pattern для гибкого создания тестовых данных
 */
export class LabelFactory {
  constructor() {
    this.data = {
      name: null,
    }
    this.apiClient = getApiClient()
  }

  /**
   * Создает новый экземпляр фабрики
   * @returns {LabelFactory} Новый экземпляр фабрики
   */
  static create() {
    return new LabelFactory()
  }

  /**
   * Устанавливает название метки
   * @param {string} name - Название метки
   * @returns {LabelFactory} Текущий экземпляр для цепочки вызовов
   */
  withName(name) {
    this.data.name = name
    return this
  }

  /**
   * Генерирует уникальное название метки на основе timestamp
   * @returns {LabelFactory} Текущий экземпляр для цепочки вызовов
   */
  withUniqueName() {
    const timestamp = Date.now()
    this.data.name = `Test Label ${timestamp}`
    return this
  }

  /**
   * Возвращает данные метки без создания в системе
   * @returns {Object} Данные метки
   */
  build() {
    if (!this.data.name) {
      this.withUniqueName()
    }
    return { ...this.data }
  }

  /**
   * Создает метку в системе через API
   * @returns {Promise<Object>} Созданная метка
   */
  async create() {
    const labelData = this.build()
    const label = await this.apiClient.createLabel(labelData)
    return label
  }

  /**
   * Создает метку и возвращает ее данные
   * @returns {Promise<Object>} Данные созданной метки
   */
  async createAndGet() {
    const label = await this.create()
    return {
      id: label.id,
      name: label.name,
    }
  }
}

/**
 * Быстрый способ создать метку с уникальным названием
 * @returns {Promise<Object>} Созданная метка
 */
export async function createTestLabel() {
  return LabelFactory.create().withUniqueName().create()
}

/**
 * Быстрый способ создать метку с указанным названием
 * @param {string} name - Название метки
 * @returns {Promise<Object>} Созданная метка
 */
export async function createTestLabelWithName(name) {
  return LabelFactory.create().withName(name).create()
}

