import { describe, it, expect, beforeEach } from 'vitest'
import { UserFactory } from '../../../factories/UserFactory.js'

describe('UserFactory', () => {
  describe('create', () => {
    it('создает новый экземпляр фабрики', () => {
      const factory = UserFactory.create()
      expect(factory).toBeInstanceOf(UserFactory)
    })
  })

  describe('withEmail', () => {
    it('устанавливает email и возвращает this для цепочки', () => {
      const factory = UserFactory.create().withEmail('test@example.com')
      const data = factory.build()
      expect(data.email).toBe('test@example.com')
      expect(factory).toBeInstanceOf(UserFactory)
    })
  })

  describe('withUniqueEmail', () => {
    it('генерирует уникальный email на основе timestamp', () => {
      const factory1 = UserFactory.create().withUniqueEmail()
      const factory2 = UserFactory.create().withUniqueEmail()

      const data1 = factory1.build()
      const data2 = factory2.build()

      expect(data1.email).toMatch(/^test\d+@example\.com$/)
      expect(data2.email).toMatch(/^test\d+@example\.com$/)
      expect(data1.email).not.toBe(data2.email)
    })
  })

  describe('withUniqueData', () => {
    it('генерирует уникальные данные пользователя', () => {
      const factory1 = UserFactory.create().withUniqueData()
      const factory2 = UserFactory.create().withUniqueData()

      const data1 = factory1.build()
      const data2 = factory2.build()

      expect(data1.email).toBeTruthy()
      expect(data1.firstName).toBeTruthy()
      expect(data1.lastName).toBeTruthy()
      expect(data1.email).not.toBe(data2.email)
    })
  })

  describe('build', () => {
    it('возвращает данные пользователя без создания в системе', () => {
      const factory = UserFactory.create()
        .withEmail('test@example.com')
        .withFirstName('John')
        .withLastName('Doe')

      const data = factory.build()

      expect(data).toEqual({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      })
    })

    it('автоматически генерирует email если не установлен', () => {
      const factory = UserFactory.create()
      const data = factory.build()

      expect(data.email).toMatch(/^test\d+@example\.com$/)
    })
  })

  describe('Fluent API', () => {
    it('поддерживает цепочку вызовов', () => {
      const data = UserFactory.create()
        .withEmail('test@example.com')
        .withFirstName('John')
        .withLastName('Doe')
        .build()

      expect(data.email).toBe('test@example.com')
      expect(data.firstName).toBe('John')
      expect(data.lastName).toBe('Doe')
    })
  })
})

