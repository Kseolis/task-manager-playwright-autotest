import { describe, it, expect } from 'vitest'
import { generateUserData, generateTaskData } from '../../helpers/testData.js'

describe('testData helpers', () => {
  describe('generateUserData', () => {
    it('генерирует уникальные данные пользователя', () => {
      const data1 = generateUserData()
      const data2 = generateUserData()

      expect(data1.email).toBeTruthy()
      expect(data2.email).toBeTruthy()
      expect(data1.email).not.toBe(data2.email)
      expect(data1.firstName).toBe('Test')
      expect(data1.lastName).toBe('User')
    })

    it('генерирует валидный email', () => {
      const data = generateUserData()
      expect(data.email).toMatch(/^test\d+@example\.com$/)
    })
  })

  describe('generateTaskData', () => {
    it('генерирует данные задачи', () => {
      const data1 = generateTaskData()
      const data2 = generateTaskData()

      expect(data1.title).toBeTruthy()
      expect(data2.title).toBeTruthy()
      expect(data1.content).toBeTruthy()
      expect(data2.content).toBeTruthy()
      // Данные могут быть одинаковыми если вызваны в один момент времени
      // Проверяем что структура правильная
      expect(typeof data1.title).toBe('string')
      expect(typeof data2.title).toBe('string')
    })
  })
})
