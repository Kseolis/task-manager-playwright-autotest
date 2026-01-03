import process from 'node:process'

/**
 * API Client для управления тестовыми данными через REST API
 * Используется для создания/удаления данных без UI для изоляции тестов
 */
export class ApiClient {
  constructor(baseURL = null) {
    this.baseURL = baseURL || process.env.BASE_URL || 'http://localhost:5173'
    this.apiBase = `${this.baseURL}/api`
    this.authToken = null
  }

  /**
   * Устанавливает токен авторизации
   * @param {string} token - JWT токен или session token
   */
  setAuthToken(token) {
    this.authToken = token
  }

  /**
   * Выполняет HTTP запрос
   * @param {string} method - HTTP метод
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Данные для отправки
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>} Ответ от сервера
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.apiBase}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }

    const config = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, config)
      const contentType = response.headers.get('content-type')

      let responseData = null
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new Error(
          `API request failed: ${method} ${url} - ${response.status} ${response.statusText}. ${JSON.stringify(responseData)}`,
        )
      }

      return responseData
    } catch (error) {
      if (error.message.includes('API request failed')) {
        throw error
      }
      throw new Error(`Network error: ${error.message}`)
    }
  }

  /**
   * GET запрос
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options)
  }

  /**
   * POST запрос
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options)
  }

  /**
   * PUT запрос
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options)
  }

  /**
   * PATCH запрос
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options)
  }

  /**
   * DELETE запрос
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options)
  }

  // ==================== Users API ====================

  /**
   * Получает список всех пользователей
   * @returns {Promise<Array>} Массив пользователей
   */
  async getUsers() {
    return this.get('/users')
  }

  /**
   * Создает нового пользователя
   * @param {Object} userData - Данные пользователя {email, firstName, lastName}
   * @returns {Promise<Object>} Созданный пользователь
   */
  async createUser(userData) {
    return this.post('/users', userData)
  }

  /**
   * Получает пользователя по ID
   * @param {number|string} id - ID пользователя
   * @returns {Promise<Object>} Пользователь
   */
  async getUser(id) {
    return this.get(`/users/${id}`)
  }

  /**
   * Обновляет пользователя
   * @param {number|string} id - ID пользователя
   * @param {Object} userData - Данные для обновления
   * @returns {Promise<Object>} Обновленный пользователь
   */
  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData)
  }

  /**
   * Удаляет пользователя
   * @param {number|string} id - ID пользователя
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    return this.delete(`/users/${id}`)
  }

  /**
   * Удаляет пользователя по email
   * @param {string} email - Email пользователя
   * @returns {Promise<void>}
   */
  async deleteUserByEmail(email) {
    const users = await this.getUsers()
    const user = users.find(u => u.email === email)
    if (user) {
      return this.deleteUser(user.id)
    }
    throw new Error(`User with email ${email} not found`)
  }

  // ==================== Statuses API ====================

  /**
   * Получает список всех статусов
   * @returns {Promise<Array>} Массив статусов
   */
  async getStatuses() {
    return this.get('/task_statuses')
  }

  /**
   * Создает новый статус
   * @param {Object} statusData - Данные статуса {name, slug}
   * @returns {Promise<Object>} Созданный статус
   */
  async createStatus(statusData) {
    return this.post('/task_statuses', statusData)
  }

  /**
   * Получает статус по ID
   * @param {number|string} id - ID статуса
   * @returns {Promise<Object>} Статус
   */
  async getStatus(id) {
    return this.get(`/task_statuses/${id}`)
  }

  /**
   * Обновляет статус
   * @param {number|string} id - ID статуса
   * @param {Object} statusData - Данные для обновления
   * @returns {Promise<Object>} Обновленный статус
   */
  async updateStatus(id, statusData) {
    return this.put(`/task_statuses/${id}`, statusData)
  }

  /**
   * Удаляет статус
   * @param {number|string} id - ID статуса
   * @returns {Promise<void>}
   */
  async deleteStatus(id) {
    return this.delete(`/task_statuses/${id}`)
  }

  /**
   * Удаляет статус по slug
   * @param {string} slug - Slug статуса
   * @returns {Promise<void>}
   */
  async deleteStatusBySlug(slug) {
    const statuses = await this.getStatuses()
    const status = statuses.find(s => s.slug === slug)
    if (status) {
      return this.deleteStatus(status.id)
    }
    throw new Error(`Status with slug ${slug} not found`)
  }

  // ==================== Labels API ====================

  /**
   * Получает список всех меток
   * @returns {Promise<Array>} Массив меток
   */
  async getLabels() {
    return this.get('/labels')
  }

  /**
   * Создает новую метку
   * @param {Object} labelData - Данные метки {name}
   * @returns {Promise<Object>} Созданная метка
   */
  async createLabel(labelData) {
    return this.post('/labels', labelData)
  }

  /**
   * Получает метку по ID
   * @param {number|string} id - ID метки
   * @returns {Promise<Object>} Метка
   */
  async getLabel(id) {
    return this.get(`/labels/${id}`)
  }

  /**
   * Обновляет метку
   * @param {number|string} id - ID метки
   * @param {Object} labelData - Данные для обновления
   * @returns {Promise<Object>} Обновленная метка
   */
  async updateLabel(id, labelData) {
    return this.put(`/labels/${id}`, labelData)
  }

  /**
   * Удаляет метку
   * @param {number|string} id - ID метки
   * @returns {Promise<void>}
   */
  async deleteLabel(id) {
    return this.delete(`/labels/${id}`)
  }

  /**
   * Удаляет метку по имени
   * @param {string} name - Имя метки
   * @returns {Promise<void>}
   */
  async deleteLabelByName(name) {
    const labels = await this.getLabels()
    const label = labels.find(l => l.name === name)
    if (label) {
      return this.deleteLabel(label.id)
    }
    throw new Error(`Label with name ${name} not found`)
  }

  // ==================== Tasks API ====================

  /**
   * Получает список всех задач
   * @returns {Promise<Array>} Массив задач
   */
  async getTasks() {
    return this.get('/tasks')
  }

  /**
   * Создает новую задачу
   * @param {Object} taskData - Данные задачи {title, content, assignee_id, status_id, label_ids}
   * @returns {Promise<Object>} Созданная задача
   */
  async createTask(taskData) {
    return this.post('/tasks', taskData)
  }

  /**
   * Получает задачу по ID
   * @param {number|string} id - ID задачи
   * @returns {Promise<Object>} Задача
   */
  async getTask(id) {
    return this.get(`/tasks/${id}`)
  }

  /**
   * Обновляет задачу
   * @param {number|string} id - ID задачи
   * @param {Object} taskData - Данные для обновления
   * @returns {Promise<Object>} Обновленная задача
   */
  async updateTask(id, taskData) {
    return this.put(`/tasks/${id}`, taskData)
  }

  /**
   * Удаляет задачу
   * @param {number|string} id - ID задачи
   * @returns {Promise<void>}
   */
  async deleteTask(id) {
    return this.delete(`/tasks/${id}`)
  }

  /**
   * Удаляет задачу по title
   * @param {string} title - Название задачи
   * @returns {Promise<void>}
   */
  async deleteTaskByTitle(title) {
    const tasks = await this.getTasks()
    const task = tasks.find(t => t.title === title)
    if (task) {
      return this.deleteTask(task.id)
    }
    throw new Error(`Task with title ${title} not found`)
  }

  // ==================== Auth API ====================

  /**
   * Авторизуется и получает токен
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} Токен и данные пользователя
   */
  async login(username, password) {
    const response = await this.post('/login', { username, password })
    if (response.token) {
      this.setAuthToken(response.token)
    }
    return response
  }

  /**
   * Выходит из системы
   * @returns {Promise<void>}
   */
  async logout() {
    await this.post('/logout')
    this.authToken = null
  }

  // ==================== Bulk Operations ====================

  /**
   * Удаляет все сущности указанного типа
   * @param {string} entityType - Тип сущности ('users', 'statuses', 'labels', 'tasks')
   * @param {Function} identifierFn - Функция для получения идентификатора из сущности
   * @returns {Promise<number>} Количество удаленных сущностей
   */
  async deleteAll(entityType, identifierFn = null) {
    let entities = []
    let deleteMethod = null

    switch (entityType) {
      case 'users':
        entities = await this.getUsers()
        deleteMethod = (id) => this.deleteUser(id)
        identifierFn = identifierFn || ((u) => u.id)
        break
      case 'statuses':
        entities = await this.getStatuses()
        deleteMethod = (id) => this.deleteStatus(id)
        identifierFn = identifierFn || ((s) => s.id)
        break
      case 'labels':
        entities = await this.getLabels()
        deleteMethod = (id) => this.deleteLabel(id)
        identifierFn = identifierFn || ((l) => l.id)
        break
      case 'tasks':
        entities = await this.getTasks()
        deleteMethod = (id) => this.deleteTask(id)
        identifierFn = identifierFn || ((t) => t.id)
        break
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }

    const deletePromises = entities.map(entity => {
      const id = identifierFn(entity)
      return deleteMethod(id).catch(error => {
        console.warn(`Failed to delete ${entityType} with id ${id}:`, error.message)
        return null
      })
    })

    await Promise.all(deletePromises)
    return entities.length
  }

  /**
   * Очищает все тестовые данные (удаляет все созданные сущности)
   * ВНИМАНИЕ: Используйте с осторожностью! Удаляет все данные.
   * @param {Array<string>} entityTypes - Типы сущностей для очистки
   * @returns {Promise<Object>} Статистика удаления
   */
  async cleanupTestData(entityTypes = ['tasks', 'labels', 'statuses', 'users']) {
    const stats = {}
    for (const type of entityTypes) {
      try {
        stats[type] = await this.deleteAll(type)
      } catch (error) {
        console.warn(`Failed to cleanup ${type}:`, error.message)
        stats[type] = 0
      }
    }
    return stats
  }
}

/**
 * Создает экземпляр API клиента
 * @param {string} baseURL - Базовый URL приложения
 * @returns {ApiClient} Экземпляр API клиента
 */
export function createApiClient(baseURL = null) {
  return new ApiClient(baseURL)
}

/**
 * Глобальный экземпляр API клиента (singleton)
 */
let globalApiClient = null

/**
 * Получает или создает глобальный экземпляр API клиента
 * @returns {ApiClient} Глобальный экземпляр API клиента
 */
export function getApiClient() {
  if (!globalApiClient) {
    globalApiClient = new ApiClient()
  }
  return globalApiClient
}

