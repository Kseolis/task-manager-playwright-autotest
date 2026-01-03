import { test, expect } from '@playwright/test'
import { loginAsValidUser } from '../../helpers/authHelper.js'
import { TasksPage } from '../../pages/TasksPage.js'
import { UsersPage } from '../../pages/UsersPage.js'

/**
 * Smoke тесты - быстрые проверки критичных путей
 * Должны выполняться за <30 секунд
 */
test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsValidUser(page)
  })

  test('приложение загружается и отображает главную страницу', async ({ page }) => {
    const tasksPage = new TasksPage(page)
    await tasksPage.goto()

    await expect(page.getByRole('heading', { name: 'Tasks', level: 6 })).toBeVisible({ timeout: 5000 })
  })

  test('страница пользователей доступна', async ({ page }) => {
    const usersPage = new UsersPage(page)
    await usersPage.goto()

    await expect(usersPage.getTableLocator()).toBeVisible({ timeout: 5000 })
  })

  test('форма создания задачи открывается', async ({ page }) => {
    const tasksPage = new TasksPage(page)
    await tasksPage.openCreateForm()

    await expect(tasksPage.getTitleInput()).toBeVisible({ timeout: 5000 })
  })
})

