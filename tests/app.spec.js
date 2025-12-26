import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'

test('приложение успешно рендерится', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()

  await expect(page).toHaveTitle(/task-manager-playwright-autotests/)
  await expect(loginPage.loginInput).toBeVisible()
  await expect(loginPage.passwordInput).toBeVisible()
  await expect(loginPage.submitButton).toBeVisible()
})
