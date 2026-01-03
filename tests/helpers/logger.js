import process from 'node:process'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Уровни логирования
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

/**
 * Структурированный логгер для тестов
 */
export class Logger {
  constructor(options = {}) {
    this.level = options.level || (process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO)
    this.logToFile = options.logToFile !== false
    this.logDir = options.logDir || 'test-results/logs'
    this.logs = []
    this.testName = null
  }

  /**
   * Устанавливает имя текущего теста
   * @param {string} testName - Имя теста
   */
  setTestName(testName) {
    this.testName = testName
  }

  /**
   * Форматирует сообщение лога
   * @param {number} level - Уровень логирования
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   * @returns {string} Отформатированное сообщение
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString()
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'INFO'
    const testInfo = this.testName ? `[${this.testName}]` : ''
    const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : ''

    return `[${timestamp}] [${levelName}]${testInfo} ${message}${metaStr}`
  }

  /**
   * Записывает лог
   * @param {number} level - Уровень логирования
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   */
  log(level, message, metadata = {}) {
    if (level < this.level) {
      return
    }

    const formattedMessage = this.formatMessage(level, message, metadata)
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'INFO',
      testName: this.testName,
      message,
      metadata,
      formatted: formattedMessage,
    }

    this.logs.push(logEntry)

    // Выводим в консоль
    if (level >= LogLevel.WARN) {
      console.error(formattedMessage)
    } else {
      console.log(formattedMessage)
    }
  }

  /**
   * Логирует DEBUG сообщение
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   */
  debug(message, metadata = {}) {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  /**
   * Логирует INFO сообщение
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   */
  info(message, metadata = {}) {
    this.log(LogLevel.INFO, message, metadata)
  }

  /**
   * Логирует WARN сообщение
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   */
  warn(message, metadata = {}) {
    this.log(LogLevel.WARN, message, metadata)
  }

  /**
   * Логирует ERROR сообщение
   * @param {string} message - Сообщение
   * @param {Object} metadata - Дополнительные метаданные
   */
  error(message, metadata = {}) {
    this.log(LogLevel.ERROR, message, metadata)
  }

  /**
   * Сохраняет логи в файл
   * @param {string} filename - Имя файла
   * @returns {Promise<void>}
   */
  async saveToFile(filename = null) {
    if (!this.logToFile) {
      return
    }

    try {
      await mkdir(this.logDir, { recursive: true })
      const filePath = join(this.logDir, filename || `test-${Date.now()}.log`)
      const content = this.logs.map(log => log.formatted).join('\n')
      await writeFile(filePath, content, 'utf-8')
      this.info(`Logs saved to ${filePath}`)
    } catch (error) {
      console.error('Failed to save logs to file:', error.message)
    }
  }

  /**
   * Очищает логи
   */
  clear() {
    this.logs = []
    this.testName = null
  }

  /**
   * Получает все логи
   * @returns {Array} Массив логов
   */
  getLogs() {
    return [...this.logs]
  }
}

/**
 * Глобальный экземпляр логгера
 */
let globalLogger = null

/**
 * Получает или создает глобальный экземпляр логгера
 * @param {Object} options - Опции логгера
 * @returns {Logger} Экземпляр логгера
 */
export function getLogger(options = {}) {
  if (!globalLogger) {
    globalLogger = new Logger(options)
  }
  return globalLogger
}

/**
 * Создает новый экземпляр логгера
 * @param {Object} options - Опции логгера
 * @returns {Logger} Новый экземпляр логгера
 */
export function createLogger(options = {}) {
  return new Logger(options)
}

