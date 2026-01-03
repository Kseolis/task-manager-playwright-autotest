import { getApiClient } from '../helpers/apiClient.js'

/**
 * Factory для создания задач
 * Использует Builder Pattern для гибкого создания тестовых данных
 */
export class TaskFactory {
  constructor() {
    this.data = {
      title: null,
      content: null,
      assignee_id: null,
      status_id: null,
      label_ids: [],
    }
    this.apiClient = getApiClient()
  }

  /**
   * Создает новый экземпляр фабрики
   * @returns {TaskFactory} Новый экземпляр фабрики
   */
  static create() {
    return new TaskFactory()
  }

  /**
   * Устанавливает заголовок задачи
   * @param {string} title - Заголовок задачи
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withTitle(title) {
    this.data.title = title
    return this
  }

  /**
   * Устанавливает содержимое задачи
   * @param {string} content - Содержимое задачи
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withContent(content) {
    this.data.content = content
    return this
  }

  /**
   * Устанавливает исполнителя по ID
   * @param {number|string} assigneeId - ID исполнителя
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withAssigneeId(assigneeId) {
    this.data.assignee_id = assigneeId
    return this
  }

  /**
   * Устанавливает исполнителя по email (находит ID по email)
   * @param {string} email - Email исполнителя
   * @returns {Promise<TaskFactory>} Текущий экземпляр для цепочки вызовов
   */
  async withAssignee(email) {
    const users = await this.apiClient.getUsers()
    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error(`User with email ${email} not found`)
    }
    this.data.assignee_id = user.id
    return this
  }

  /**
   * Устанавливает статус по ID
   * @param {number|string} statusId - ID статуса
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withStatusId(statusId) {
    this.data.status_id = statusId
    return this
  }

  /**
   * Устанавливает статус по slug (находит ID по slug)
   * @param {string} slug - Slug статуса
   * @returns {Promise<TaskFactory>} Текущий экземпляр для цепочки вызовов
   */
  async withStatus(slug) {
    const statuses = await this.apiClient.getStatuses()
    const status = statuses.find(s => s.slug === slug)
    if (!status) {
      throw new Error(`Status with slug ${slug} not found`)
    }
    this.data.status_id = status.id
    return this
  }

  /**
   * Добавляет метку по ID
   * @param {number|string} labelId - ID метки
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withLabelId(labelId) {
    if (!this.data.label_ids.includes(labelId)) {
      this.data.label_ids.push(labelId)
    }
    return this
  }

  /**
   * Добавляет метку по имени (находит ID по имени)
   * @param {string} labelName - Имя метки
   * @returns {Promise<TaskFactory>} Текущий экземпляр для цепочки вызовов
   */
  async withLabel(labelName) {
    const labels = await this.apiClient.getLabels()
    const label = labels.find(l => l.name === labelName)
    if (!label) {
      throw new Error(`Label with name ${labelName} not found`)
    }
    if (!this.data.label_ids.includes(label.id)) {
      this.data.label_ids.push(label.id)
    }
    return this
  }

  /**
   * Устанавливает несколько меток по именам
   * @param {Array<string>} labelNames - Массив имен меток
   * @returns {Promise<TaskFactory>} Текущий экземпляр для цепочки вызовов
   */
  async withLabels(labelNames) {
    const labels = await this.apiClient.getLabels()
    for (const labelName of labelNames) {
      const label = labels.find(l => l.name === labelName)
      if (!label) {
        throw new Error(`Label with name ${labelName} not found`)
      }
      if (!this.data.label_ids.includes(label.id)) {
        this.data.label_ids.push(label.id)
      }
    }
    return this
  }

  /**
   * Генерирует уникальные данные задачи на основе timestamp
   * @returns {TaskFactory} Текущий экземпляр для цепочки вызовов
   */
  withUniqueData() {
    const timestamp = Date.now()
    this.data.title = `Test Task ${timestamp}`
    this.data.content = `Description ${timestamp}`
    return this
  }

  /**
   * Возвращает данные задачи без создания в системе
   * @returns {Object} Данные задачи
   */
  build() {
    if (!this.data.title) {
      this.withUniqueData()
    }
    if (!this.data.content) {
      const timestamp = Date.now()
      this.data.content = `Description ${timestamp}`
    }
    return { ...this.data }
  }

  /**
   * Создает задачу в системе через API
   * @returns {Promise<Object>} Созданная задача
   */
  async create() {
    const taskData = this.build()
    const task = await this.apiClient.createTask(taskData)
    return task
  }

  /**
   * Создает задачу и возвращает ее данные
   * @returns {Promise<Object>} Данные созданной задачи
   */
  async createAndGet() {
    const task = await this.create()
    return {
      id: task.id,
      title: task.title,
      content: task.content,
      assignee_id: task.assignee_id,
      status_id: task.status_id,
      label_ids: task.label_ids || [],
    }
  }
}

/**
 * Быстрый способ создать задачу с уникальными данными
 * @returns {Promise<Object>} Созданная задача
 */
export async function createTestTask() {
  return TaskFactory.create().withUniqueData().create()
}

/**
 * Быстрый способ создать задачу с указанным заголовком
 * @param {string} title - Заголовок задачи
 * @returns {Promise<Object>} Созданная задача
 */
export async function createTestTaskWithTitle(title) {
  return TaskFactory.create().withTitle(title).withUniqueData().create()
}

