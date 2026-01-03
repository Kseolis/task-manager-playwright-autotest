import { describe, it, expect } from 'vitest'
import { TaskFactory } from '../../../factories/TaskFactory.js'

describe('TaskFactory', () => {
  describe('create', () => {
    it('создает новый экземпляр фабрики', () => {
      const factory = TaskFactory.create()
      expect(factory).toBeInstanceOf(TaskFactory)
    })
  })

  describe('withTitle', () => {
    it('устанавливает заголовок задачи', () => {
      const factory = TaskFactory.create().withTitle('Test Task')
      const data = factory.build()
      expect(data.title).toBe('Test Task')
    })
  })

  describe('withContent', () => {
    it('устанавливает содержимое задачи', () => {
      const factory = TaskFactory.create().withContent('Test Content')
      const data = factory.build()
      expect(data.content).toBe('Test Content')
    })
  })

  describe('withAssigneeId', () => {
    it('устанавливает ID исполнителя', () => {
      const factory = TaskFactory.create().withAssigneeId(123)
      const data = factory.build()
      expect(data.assignee_id).toBe(123)
    })
  })

  describe('withStatusId', () => {
    it('устанавливает ID статуса', () => {
      const factory = TaskFactory.create().withStatusId(456)
      const data = factory.build()
      expect(data.status_id).toBe(456)
    })
  })

  describe('withLabelId', () => {
    it('добавляет ID метки', () => {
      const factory = TaskFactory.create().withLabelId(789)
      const data = factory.build()
      expect(data.label_ids).toContain(789)
    })

    it('не добавляет дубликаты меток', () => {
      const factory = TaskFactory.create()
        .withLabelId(789)
        .withLabelId(789)
      const data = factory.build()
      expect(data.label_ids.filter(id => id === 789).length).toBe(1)
    })
  })

  describe('withUniqueData', () => {
    it('генерирует уникальные данные задачи', () => {
      const factory1 = TaskFactory.create().withUniqueData()
      const factory2 = TaskFactory.create().withUniqueData()

      const data1 = factory1.build()
      const data2 = factory2.build()

      expect(data1.title).toBeTruthy()
      expect(data1.content).toBeTruthy()
      expect(data1.title).not.toBe(data2.title)
    })
  })

  describe('build', () => {
    it('возвращает данные задачи без создания в системе', () => {
      const factory = TaskFactory.create()
        .withTitle('Test Task')
        .withContent('Test Content')
        .withAssigneeId(1)
        .withStatusId(2)
        .withLabelId(3)

      const data = factory.build()

      expect(data.title).toBe('Test Task')
      expect(data.content).toBe('Test Content')
      expect(data.assignee_id).toBe(1)
      expect(data.status_id).toBe(2)
      expect(data.label_ids).toContain(3)
    })

    it('автоматически генерирует title если не установлен', () => {
      const factory = TaskFactory.create()
      const data = factory.build()

      expect(data.title).toMatch(/^Test Task \d+$/)
    })
  })

  describe('Fluent API', () => {
    it('поддерживает цепочку вызовов', () => {
      const data = TaskFactory.create()
        .withTitle('My Task')
        .withContent('My Content')
        .withAssigneeId(1)
        .withStatusId(2)
        .withLabelId(3)
        .build()

      expect(data.title).toBe('My Task')
      expect(data.content).toBe('My Content')
      expect(data.assignee_id).toBe(1)
      expect(data.status_id).toBe(2)
      expect(data.label_ids).toContain(3)
    })
  })
})

