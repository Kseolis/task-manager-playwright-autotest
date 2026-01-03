import { describe, it, expect, beforeEach } from 'vitest'
import { Logger, LogLevel, createLogger } from '../../../helpers/logger.js'

describe('Logger', () => {
  let logger

  beforeEach(() => {
    logger = createLogger({ logToFile: false })
  })

  describe('log levels', () => {
    it('логирует DEBUG сообщения', () => {
      logger.level = LogLevel.DEBUG
      expect(() => logger.debug('Debug message')).not.toThrow()
    })

    it('логирует INFO сообщения', () => {
      expect(() => logger.info('Info message')).not.toThrow()
    })

    it('логирует WARN сообщения', () => {
      expect(() => logger.warn('Warning message')).not.toThrow()
    })

    it('логирует ERROR сообщения', () => {
      expect(() => logger.error('Error message')).not.toThrow()
    })
  })

  describe('level filtering', () => {
    it('не логирует сообщения ниже установленного уровня', () => {
      logger.level = LogLevel.WARN
      logger.debug('Should not log')
      logger.info('Should not log')

      const logs = logger.getLogs()
      expect(logs.length).toBe(0)
    })

    it('логирует сообщения на уровне и выше', () => {
      logger.level = LogLevel.WARN
      logger.warn('Should log')
      logger.error('Should log')

      const logs = logger.getLogs()
      expect(logs.length).toBe(2)
    })
  })

  describe('setTestName', () => {
    it('устанавливает имя текущего теста', () => {
      logger.setTestName('My Test')
      logger.info('Test message')

      const logs = logger.getLogs()
      expect(logs[0].testName).toBe('My Test')
      expect(logs[0].formatted).toContain('[My Test]')
    })
  })

  describe('formatMessage', () => {
    it('форматирует сообщение с метаданными', () => {
      logger.info('Test message', { key: 'value' })

      const logs = logger.getLogs()
      expect(logs[0].metadata).toEqual({ key: 'value' })
      expect(logs[0].formatted).toContain('Test message')
    })
  })

  describe('clear', () => {
    it('очищает логи', () => {
      logger.info('Message 1')
      logger.info('Message 2')

      expect(logger.getLogs().length).toBe(2)

      logger.clear()

      expect(logger.getLogs().length).toBe(0)
      expect(logger.testName).toBeNull()
    })
  })
})

