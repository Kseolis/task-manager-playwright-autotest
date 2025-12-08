import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { UsersPage } from './pages/UsersPage.js'
import { testUsers, generateUserData, generateEditedUserData } from './helpers/testData.js'

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(testUsers.valid.login, testUsers.valid.password)
})

test.describe('Создание пользователей', () => {
  test('форма создания пользователя отображается корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    await usersPage.clickCreate()

    const form = await usersPage.isCreateFormVisible()
    await expect.soft(form.email).toBeVisible()
    await expect.soft(form.firstName).toBeVisible()
    await expect.soft(form.lastName).toBeVisible()
    await expect(form.saveButton).toBeVisible()
  })

  test('создание нового пользователя с валидными данными', async ({ page }) => {
    const usersPage = new UsersPage(page)
    const userData = generateUserData()

    const { initialCount } = await usersPage.createUser(userData)

    await expect.poll(() => usersPage.getUserCount(), { timeout: 10000 }).toBeGreaterThan(initialCount)
    await expect.poll(() => usersPage.isUserVisible(userData.email), { timeout: 10000 }).toBe(true)

    const verification = await usersPage.verifyUserData(userData.email, userData)
    await expect.soft(verification.email).toBe(true)
    await expect.soft(verification.firstName).toBe(true)
    await expect.soft(verification.lastName).toBe(true)
  })
})

test.describe('Просмотр списка пользователей', () => {
  test('список пользователей отображается полностью и корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()

    await expect(usersPage.usersTable).toBeVisible()
    const userCount = await usersPage.getUserCount()
    await expect(userCount).toBeGreaterThan(0)
  })

  test('отображается основная информация о каждом пользователе', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()

    const rows = await usersPage.getAllUserRows()
    await expect(rows.length).toBeGreaterThan(0)

    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      const userData = await usersPage.getUserRowData(rows[i])
      await expect.soft(userData.email).toBeTruthy()
      await expect.soft(userData.firstName).toBeTruthy()
      await expect.soft(userData.lastName).toBeTruthy()
    }
  })
})

test.describe('Редактирование пользователей', () => {
  test('форма редактирования пользователя отображается правильно', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    const firstUserEmail = await usersPage.getFirstUserEmail()
    await expect(firstUserEmail).toBeTruthy()

    await usersPage.clickEditUser(firstUserEmail)

    const form = await usersPage.isEditFormVisible()
    await expect.soft(form.email).toBeVisible({ timeout: 5000 })
    await expect.soft(form.firstName).toBeVisible({ timeout: 5000 })
    await expect.soft(form.lastName).toBeVisible({ timeout: 5000 })
  })

  test('изменение данных пользователя сохраняется корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)
    const editedData = generateEditedUserData()

    await usersPage.goto()
    const firstUserEmail = await usersPage.getFirstUserEmail()
    await expect(firstUserEmail).toBeTruthy()

    await usersPage.editUser(firstUserEmail, editedData)

    await expect.poll(() => usersPage.isUserVisible(editedData.email), { timeout: 10000 }).toBe(true)

    const verification = await usersPage.verifyUserData(editedData.email, editedData)
    await expect.soft(verification.email).toBe(true)
    await expect.soft(verification.firstName).toBe(true)
    await expect.soft(verification.lastName).toBe(true)
  })

  test('валидация данных при редактировании пользователя', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    const firstUserEmail = await usersPage.getFirstUserEmail()
    await expect(firstUserEmail).toBeTruthy()

    await usersPage.clickEditUser(firstUserEmail)

    const result = await usersPage.fillInvalidEmail('invalid-email')

    const isEditPage = await usersPage.isEditPage()
    await expect.soft(isEditPage).toBe(true)
    const inputValue = await result.getInputValue()
    await expect.soft(inputValue).toBe('invalid-email')
  })
})

test.describe('Удаление пользователей', () => {
  test('удаление одного пользователя', async ({ page }) => {
    const usersPage = new UsersPage(page)

    const { initialCount, firstUserEmail } = await usersPage.deleteFirstUser()

    await expect(initialCount).toBeGreaterThan(0)
    await expect.poll(() => usersPage.getUserCount()).toBeLessThan(initialCount)
    await expect.poll(() => usersPage.isUserVisible(firstUserEmail)).toBe(false)
  })
})

test.describe('Массовое удаление пользователей', () => {
  test('выделение всех пользователей', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    await usersPage.selectAllUsers()

    await expect.poll(() => usersPage.areAllCheckboxesSelected()).toBe(true)
  })

  test('массовое удаление всех пользователей', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    const initialCount = await usersPage.getUserCount()
    await usersPage.selectAllUsers()
    await usersPage.deleteAllSelected()
    await expect.poll(() => usersPage.getUserCount()).toBeLessThan(initialCount)
  })
})
