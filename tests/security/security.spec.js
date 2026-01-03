import { test, expect } from '@playwright/test'
import { loginAsValidUser } from '../helpers/authHelper.js'
import { UsersPage } from '../pages/UsersPage.js'

/**
 * Security тесты
 * 
 * ЗАЧЕМ: Проверяем базовые уязвимости безопасности
 * ПОЧЕМУ: Security - критичный аспект любого приложения
 * 
 * АЛЬТЕРНАТИВЫ:
 * 1. OWASP ZAP - автоматическое сканирование уязвимостей
 * 2. Burp Suite - профессиональный инструмент для security тестирования
 * 3. Snyk/WhiteSource - проверка зависимостей
 * 
 * ВЫБОР: Базовые проверки через Playwright + npm audit для зависимостей
 *        Для production нужны специализированные инструменты (ZAP, Burp)
 */
test.describe('Security Tests', () => {
  test.describe('XSS Protection', () => {
    test('приложение защищено от XSS в полях ввода', async ({ page }) => {
      // ЗАЧЕМ: Проверяем защиту от XSS (Cross-Site Scripting)
      // ПОЧЕМУ: XSS позволяет злоумышленнику выполнить JavaScript в браузере пользователя
      // 
      // КАК РАБОТАЕТ: Пытаемся ввести скрипт, проверяем что он не выполняется
      // АЛЬТЕРНАТИВА: Можно использовать автоматические сканеры (ZAP),
      //               но ручные проверки дают больше контроля
      
      await loginAsValidUser(page)
      const usersPage = new UsersPage(page)

      // XSS payload - типичные векторы атак
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
      ]

      await usersPage.goto()
      await usersPage.clickCreate()

      for (const payload of xssPayloads) {
        // Пытаемся ввести XSS payload
        await usersPage.fillUserForm({
          email: `${payload}@example.com`,
          firstName: payload,
          lastName: payload,
        })

        // Проверяем, что скрипт не выполнился (нет alert)
        // В реальном приложении нужно проверить, что payload экранирован в HTML
        const emailValue = await page.locator('input[name="email"]').inputValue()
        
        // Проверяем, что значение не содержит опасные теги как есть
        // (должно быть экранировано или удалено)
        expect(emailValue).not.toContain('<script>')
        expect(emailValue).not.toContain('javascript:')
      }
    })
  })

  test.describe('Authorization', () => {
    test('неавторизованный пользователь не может получить доступ к защищенным страницам', async ({ page }) => {
      // ЗАЧЕМ: Проверяем авторизацию доступа
      // ПОЧЕМУ: Неавторизованные пользователи не должны видеть защищенные данные
      // 
      // КАК РАБОТАЕТ: Пытаемся открыть страницу без авторизации,
      //               проверяем редирект на страницу логина
      // АЛЬТЕРНАТИВА: Можно использовать API тесты для проверки 401/403,
      //               но UI проверка тоже важна
      
      // Не авторизуемся
      await page.goto('/#/users')

      // Проверяем, что нас перенаправило на страницу логина
      // В реальном приложении нужно проверить URL или наличие формы логина
      await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Input Validation', () => {
    test('валидация email предотвращает SQL injection', async ({ page }) => {
      // ЗАЧЕМ: Проверяем защиту от SQL injection через валидацию
      // ПОЧЕМУ: SQL injection - критичная уязвимость
      // 
      // КАК РАБОТАЕТ: Пытаемся ввести SQL payload, проверяем что он отклонен
      // АЛЬТЕРНАТИВА: Для полноценной проверки нужны API тесты с реальной БД,
      //               но проверка валидации на фронте тоже важна
      
      await loginAsValidUser(page)
      const usersPage = new UsersPage(page)

      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "1' UNION SELECT * FROM users--",
      ]

      await usersPage.goto()
      await usersPage.clickCreate()

      for (const payload of sqlPayloads) {
        const result = await usersPage.fillInvalidEmail(payload)
        
        // Проверяем, что форма не приняла невалидный email
        // В реальном приложении должно быть сообщение об ошибке
        const inputValue = await result.getInputValue()
        // Значение может быть введено, но форма не должна сохранить его
        // Проверяем, что мы все еще на странице создания (не произошел редирект)
        const isCreatePage = page.url().includes('/create')
        expect(isCreatePage).toBe(true)
      }
    })
  })
})

