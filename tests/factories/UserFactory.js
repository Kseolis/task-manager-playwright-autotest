import { getApiClient } from '../helpers/apiClient.js'

/**
 * Factory для создания пользователей
 * Использует Builder Pattern для гибкого создания тестовых данных
 */
export class UserFactory {
  constructor() {
    this.data = {
      email: null,
      firstName: 'Test',
      lastName: 'User',
    }
    this.apiClient = getApiClient()
  }

  /**
   * Создает новый экземпляр фабрики
   * @returns {UserFactory} Новый экземпляр фабрики
   */
  static create() {
    return new UserFactory()
  }

  /**
   * Устанавливает email
   * @param {string} email - Email пользователя
   * @returns {UserFactory} Текущий экземпляр для цепочки вызовов
   */
  withEmail(email) {
    this.data.email = email
    return this
  }

  /**
   * Устанавливает имя
   * @param {string} firstName - Имя пользователя
   * @returns {UserFactory} Текущий экземпляр для цепочки вызовов
   */
  withFirstName(firstName) {
    this.data.firstName = firstName
    return this
  }

  /**
   * Устанавливает фамилию
   * @param {string} lastName - Фамилия пользователя
   * @returns {UserFactory} Текущий экземпляр для цепочки вызовов
   */
  withLastName(lastName) {
    this.data.lastName = lastName
    return this
  }

  /**
   * Генерирует уникальный email на основе timestamp
   * @returns {UserFactory} Текущий экземпляр для цепочки вызовов
   */
  withUniqueEmail() {
    const timestamp = Date.now()
    this.data.email = `test${timestamp}@example.com`
    return this
  }

  /**
   * Генерирует уникальные данные пользователя
   * @returns {UserFactory} Текущий экземпляр для цепочки вызовов
   */
  withUniqueData() {
    const timestamp = Date.now()
    this.data.email = `test${timestamp}@example.com`
    this.data.firstName = `Test${timestamp}`
    this.data.lastName = `User${timestamp}`
    return this
  }

  /**
   * Возвращает данные пользователя без создания в системе
   * @returns {Object} Данные пользователя
   */
  build() {
    if (!this.data.email) {
      this.withUniqueEmail()
    }
    return { ...this.data }
  }

  /**
   * Создает пользователя в системе через API
   * @returns {Promise<Object>} Созданный пользователь
   */
  async create() {
    const userData = this.build()
    const user = await this.apiClient.createUser(userData)
    return user
  }

  /**
   * Создает пользователя и возвращает его данные
   * @returns {Promise<Object>} Данные созданного пользователя
   */
  async createAndGet() {
    const user = await this.create()
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  }
}

/**
 * Быстрый способ создать пользователя с уникальными данными
 * @returns {Promise<Object>} Созданный пользователь
 */
export async function createTestUser() {
  return UserFactory.create().withUniqueData().create()
}

/**
 * Быстрый способ создать пользователя с указанным email
 * @param {string} email - Email пользователя
 * @returns {Promise<Object>} Созданный пользователь
 */
export async function createTestUserWithEmail(email) {
  return UserFactory.create().withEmail(email).withUniqueData().create()
}

