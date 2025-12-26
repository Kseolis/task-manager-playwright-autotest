import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { testUsers } from './helpers/testData.js'

test.describe('Авторизация', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('успешная авторизация с валидными данными', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await Promise.all([
      expect.soft(loginPage.loginInput).toBeVisible(),
      expect.soft(loginPage.passwordInput).toBeVisible(),
    ])
    await loginPage.login(testUsers.valid.login, testUsers.valid.password)
    await expect(loginPage.loginInput).not.toBeVisible()
  })

  test('авторизация с любыми данными должна быть успешной', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(testUsers.admin.login, testUsers.admin.password)
    await expect(loginPage.loginInput).not.toBeVisible()
  })

  test('авторизация с пустыми полями', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.submitButton.click()
    await expect(loginPage.loginInput).toBeVisible()
  })
})

test.describe('Выход из приложения', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('успешный выход из приложения', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(testUsers.valid.login, testUsers.valid.password)
    await expect(loginPage.loginInput).not.toBeVisible()

    await loginPage.logout()
    await Promise.all([
      expect.poll(() => loginPage.loginInput.isVisible()).toBe(true),
      expect.soft(loginPage.passwordInput).toBeVisible(),
    ])
  })

  test('после выхода можно снова авторизоваться', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(testUsers.user1.login, testUsers.user1.password)
    await expect(loginPage.loginInput).not.toBeVisible()

    await loginPage.logout()
    await expect.poll(() => loginPage.loginInput.isVisible()).toBe(true)

    await loginPage.login(testUsers.user2.login, testUsers.user2.password)
    await expect(loginPage.loginInput).not.toBeVisible()
  })
})
