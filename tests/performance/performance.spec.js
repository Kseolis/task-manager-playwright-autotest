import { test, expect } from '@playwright/test'
import { loginAsValidUser } from '../helpers/authHelper.js'
import { TasksPage } from '../pages/TasksPage.js'
import { UsersPage } from '../pages/UsersPage.js'

/**
 * Performance тесты
 * 
 * ЗАЧЕМ: Проверяем, что приложение работает в пределах Performance Budgets
 * ПОЧЕМУ: Медленное приложение = плохой UX = потеря пользователей
 * 
 * АЛЬТЕРНАТИВЫ:
 * 1. Lighthouse CI - автоматический анализ производительности
 * 2. WebPageTest - детальный анализ загрузки
 * 3. k6/Gatling - нагрузочное тестирование
 * 
 * ВЫБОР: Playwright performance API - встроен, не требует дополнительных инструментов,
 *        дает метрики времени выполнения операций
 */
test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsValidUser(page)
  })

  test.describe('Page Load Performance', () => {
    test('страница задач загружается за <2 секунды', async ({ page }) => {
      // ЗАЧЕМ: Проверяем время загрузки критичной страницы
      // ПОЧЕМУ: Пользователи ожидают быструю загрузку (<2s считается хорошим)
      // АЛЬТЕРНАТИВА: Можно использовать Navigation Timing API, но Playwright проще
      
      const startTime = Date.now()
      const tasksPage = new TasksPage(page)
      await tasksPage.goto()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(2000) // Performance Budget: 2 секунды
    })

    test('страница пользователей загружается за <2 секунды', async ({ page }) => {
      const startTime = Date.now()
      const usersPage = new UsersPage(page)
      await usersPage.goto()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('Operation Performance', () => {
    test('создание пользователя выполняется за <1 секунды', async ({ page }) => {
      // ЗАЧЕМ: Проверяем производительность CRUD операций
      // ПОЧЕМУ: Медленные операции = плохой UX
      // АЛЬТЕРНАТИВА: Можно измерять через Performance Observer API,
      //               но измерение времени выполнения проще и понятнее
      
      const usersPage = new UsersPage(page)
      await usersPage.goto()

      const startTime = Date.now()
      await usersPage.clickCreate()
      await usersPage.fillUserForm({
        email: `perf${Date.now()}@example.com`,
        firstName: 'Perf',
        lastName: 'Test',
      })
      await usersPage.saveUser()
      const operationTime = Date.now() - startTime

      expect(operationTime).toBeLessThan(1000) // Performance Budget: 1 секунда
    })

    test('открытие формы создания задачи за <500ms', async ({ page }) => {
      // ЗАЧЕМ: Проверяем время отклика UI
      // ПОЧЕМУ: Пользователи ожидают мгновенный отклик на действия
      // АЛЬТЕРНАТИВА: Можно использовать requestIdleCallback для измерения,
      //               но простой таймер достаточен для E2E тестов
      
      const tasksPage = new TasksPage(page)
      await tasksPage.goto()

      const startTime = Date.now()
      await tasksPage.openCreateForm()
      const openTime = Date.now() - startTime

      expect(openTime).toBeLessThan(500) // Performance Budget: 500ms
    })
  })

  test.describe('Baseline Comparison', () => {
    test('время загрузки страницы не деградировало', async ({ page }) => {
      // ЗАЧЕМ: Baseline comparison - сравниваем с эталонным значением
      // ПОЧЕМУ: Предотвращаем регрессии производительности
      // АЛЬТЕРНАТИВА: Можно использовать Lighthouse CI с baseline,
      //               но для простых метрик достаточно сравнения с константой
      // 
      // В PRODUCTION: Baseline должен храниться в CI/CD и обновляться
      //               при улучшениях производительности
      
      const BASELINE_LOAD_TIME = 2000 // Baseline: 2 секунды

      const startTime = Date.now()
      const tasksPage = new TasksPage(page)
      await tasksPage.goto()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThanOrEqual(BASELINE_LOAD_TIME * 1.2) // Допускаем 20% деградацию
    })
  })
})

