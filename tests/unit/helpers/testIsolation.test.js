import { describe, it, expect } from 'vitest'
import { TestDataRegistry, _cleanupRegisteredEntities } from '../../../helpers/testIsolation.js'

describe('TestDataRegistry', () => {
  describe('register', () => {
    it('регистрирует созданную сущность', () => {
      const registry = new TestDataRegistry()
      registry.register('users', 1)
      registry.register('tasks', 2)

      const all = registry.getAll()
      expect(all.users).toContain(1)
      expect(all.tasks).toContain(2)
    })

    it('не добавляет дубликаты', () => {
      const registry = new TestDataRegistry()
      registry.register('users', 1)
      registry.register('users', 1)

      const all = registry.getAll()
      expect(all.users.filter(id => id === 1).length).toBe(1)
    })
  })

  describe('getAll', () => {
    it('возвращает копию всех зарегистрированных сущностей', () => {
      const registry = new TestDataRegistry()
      registry.register('users', 1)
      registry.register('statuses', 2)

      const all1 = registry.getAll()
      const all2 = registry.getAll()

      expect(all1).toEqual(all2)
      expect(all1).not.toBe(all2) // Должна быть копия
    })
  })

  describe('clear', () => {
    it('очищает реестр', () => {
      const registry = new TestDataRegistry()
      registry.register('users', 1)
      registry.register('tasks', 2)

      registry.clear()

      const all = registry.getAll()
      expect(all.users).toEqual([])
      expect(all.tasks).toEqual([])
    })
  })
})
