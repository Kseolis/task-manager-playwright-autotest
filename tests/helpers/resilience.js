import { TIMEOUTS } from './constants.js'
import { getLogger } from './logger.js'

const logger = getLogger()

/**
 * Retry логика для нестабильных операций
 * @param {Function} fn - Функция для выполнения
 * @param {Object} options - Опции retry
 * @param {number} options.maxRetries - Максимальное количество попыток
 * @param {number} options.delay - Задержка между попытками в мс
 * @param {Function} options.shouldRetry - Функция для определения, нужно ли повторять
 * @returns {Promise<any>} Результат выполнения функции
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = (error) => error !== null,
  } = options

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      if (attempt > 1) {
        logger.info(`Operation succeeded on attempt ${attempt}`)
      }
      return result
    } catch (error) {
      lastError = error
      if (!shouldRetry(error) || attempt === maxRetries) {
        break
      }
      logger.warn(`Operation failed on attempt ${attempt}/${maxRetries}, retrying...`, {
        error: error.message,
      })
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

/**
 * Circuit Breaker для внешних зависимостей
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 60000 // 1 минута
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.lastFailureTime = null
    this.name = options.name || 'CircuitBreaker'
  }

  /**
   * Выполняет функцию через circuit breaker
   * @param {Function} fn - Функция для выполнения
   * @returns {Promise<any>} Результат выполнения
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN'
        logger.info(`${this.name}: Circuit breaker transitioning to HALF_OPEN`)
      } else {
        throw new Error(`${this.name}: Circuit breaker is OPEN`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      logger.info(`${this.name}: Circuit breaker closed after successful call`)
    }
  }

  onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      logger.error(`${this.name}: Circuit breaker opened after ${this.failureCount} failures`)
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.lastFailureTime = null
    logger.info(`${this.name}: Circuit breaker reset`)
  }
}

/**
 * Глобальные circuit breakers
 */
const circuitBreakers = new Map()

/**
 * Получает или создает circuit breaker
 * @param {string} name - Имя circuit breaker
 * @param {Object} options - Опции
 * @returns {CircuitBreaker} Circuit breaker
 */
export function getCircuitBreaker(name, options = {}) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker({ ...options, name }))
  }
  return circuitBreakers.get(name)
}

/**
 * Валидация состояния элемента перед взаимодействием
 * @param {Object} locator - Playwright locator
 * @param {Object} options - Опции валидации
 * @returns {Promise<boolean>} Готов ли элемент к взаимодействию
 */
export async function validateElementReady(locator, options = {}) {
  const {
    timeout = TIMEOUTS.SHORT,
    checkVisible = true,
    checkEnabled = true,
    checkAttached = true,
  } = options

  try {
    if (checkAttached) {
      await locator.waitFor({ state: 'attached', timeout })
    }
    if (checkVisible) {
      await locator.waitFor({ state: 'visible', timeout })
    }
    if (checkEnabled) {
      const isEnabled = await locator.isEnabled()
      if (!isEnabled) {
        logger.warn('Element is not enabled', { locator: locator.toString() })
        return false
      }
    }
    return true
  } catch (error) {
    logger.error('Element validation failed', {
      error: error.message,
      locator: locator.toString(),
    })
    return false
  }
}

/**
 * Graceful degradation при недоступности элементов
 * @param {Function} fn - Функция для выполнения
 * @param {any} fallbackValue - Значение по умолчанию
 * @param {Object} options - Опции
 * @returns {Promise<any>} Результат или fallback значение
 */
export async function withGracefulDegradation(fn, fallbackValue = null, options = {}) {
  const { logWarning = true } = options

  try {
    return await fn()
  } catch (error) {
    if (logWarning) {
      logger.warn('Operation failed, using fallback value', {
        error: error.message,
        fallback: fallbackValue,
      })
    }
    return fallbackValue
  }
}

