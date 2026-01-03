import { test, expect } from '@playwright/test'
import { UsersPage } from './pages/UsersPage.js'
import { generateUserData, generateEditedUserData } from './helpers/testData.js'
import { loginAsValidUser } from './helpers/authHelper.js'
import {
  verifyCreateFormVisible,
  verifyEntityCreated,
  verifyListDisplayed,
  verifyRowsData,
  verifyEntityEdited,
  verifyEntityDeleted,
  verifyBulkDelete,
  verifyEditFormVisible,
} from './helpers/testHelpers.js'
import { UserFactory } from './factories/UserFactory.js'
import { createIsolatedTestContext } from './helpers/testIsolation.js'

test.beforeEach(async ({ page }) => {
  await loginAsValidUser(page)
})

test.afterEach(async ({ page }) => {
  // Очистка состояния браузера после каждого теста
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test.describe('Создание пользователей', () => {
  test('форма создания пользователя отображается корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    await usersPage.clickCreate()

    const form = await usersPage.isCreateFormVisible()
    await verifyCreateFormVisible(form, ['email', 'firstName', 'lastName'])
  })

  test('создание нового пользователя с валидными данными', async ({ page }) => {
    const context = createIsolatedTestContext(page)
    const usersPage = new UsersPage(page)
    const userData = generateUserData()

    await usersPage.goto()
    const initialCount = await usersPage.getUserCount()

    await usersPage.clickCreate()
    await usersPage.fillUserForm(userData)
    await usersPage.saveUser()
    await usersPage.goto()

    // Регистрируем для очистки
    const createdUser = await usersPage.getUserRowByEmail(userData.email)
    const userId = await usersPage.getIdFromRow(createdUser)
    context.registry.register('users', userId)

    await verifyEntityCreated(
      usersPage,
      initialCount,
      userData.email,
      email => usersPage.isUserVisible(email),
    )

    const verification = await usersPage.verifyUserData(userData.email, userData)
    await expect.soft(verification.email).toBe(true)
    await expect.soft(verification.firstName).toBe(true)
    await expect.soft(verification.lastName).toBe(true)

    await context.cleanup()
  })
})

test.describe('Просмотр списка пользователей', () => {
  test('список пользователей отображается полностью и корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)
    await verifyListDisplayed(usersPage)
  })

  test('отображается основная информация о каждом пользователе', async ({ page }) => {
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    const rows = await usersPage.getAllUserRows()

    await verifyRowsData(rows, row => usersPage.getUserRowData(row), ['email', 'firstName', 'lastName'])
  })
})

test.describe('Редактирование пользователей', () => {
  test('форма редактирования пользователя отображается правильно', async ({ page }) => {
    const context = createIsolatedTestContext(page)
    const usersPage = new UsersPage(page)

    // Создаем пользователя для редактирования
    const user = await UserFactory.create().withUniqueData().create()
    context.registry.register('users', user.id)

    await usersPage.goto()
    await usersPage.clickEditUser(user.email)
    const form = await usersPage.isEditFormVisible()
    await verifyEditFormVisible(form, ['email', 'firstName', 'lastName'])

    await context.cleanup()
  })

  test('изменение данных пользователя сохраняется корректно', async ({ page }) => {
    const context = createIsolatedTestContext(page)
    const usersPage = new UsersPage(page)

    // Создаем пользователя для редактирования
    const user = await UserFactory.create().withUniqueData().create()
    context.registry.register('users', user.id)

    const editedData = generateEditedUserData()

    await usersPage.goto()
    await usersPage.clickEditUser(user.email)
    await usersPage.fillUserForm(editedData)
    await usersPage.saveUser()
    await usersPage.goto()

    await verifyEntityEdited(
      usersPage,
      editedData.email,
      email => usersPage.isUserVisible(email),
      (email, data) => usersPage.verifyUserData(email, data),
      editedData,
    )

    await context.cleanup()
  })

  test('валидация данных при редактировании пользователя', async ({ page }) => {
    const context = createIsolatedTestContext(page)
    const usersPage = new UsersPage(page)

    // Создаем пользователя для редактирования
    const user = await UserFactory.create().withUniqueData().create()
    context.registry.register('users', user.id)

    await usersPage.goto()
    await usersPage.clickEditUser(user.email)

    const result = await usersPage.fillInvalidEmail('invalid-email')

    const isEditPage = await usersPage.isEditPage()
    await expect.soft(isEditPage).toBe(true)
    const inputValue = await result.getInputValue()
    await expect.soft(inputValue).toBe('invalid-email')

    await context.cleanup()
  })
})

test.describe('Удаление пользователей', () => {
  test('удаление одного пользователя', async ({ page }) => {
    const context = createIsolatedTestContext(page)
    const usersPage = new UsersPage(page)

    // Создаем пользователя для удаления
    const user = await UserFactory.create().withUniqueData().create()
    // Не регистрируем в registry, так как удаляем его в тесте

    await usersPage.goto()
    const initialCount = await usersPage.getUserCount()
    await usersPage.deleteUser(user.email)

    await verifyEntityDeleted(
      usersPage,
      initialCount,
      user.email,
      email => usersPage.isUserVisible(email),
    )

    await context.cleanup()
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
    await verifyBulkDelete(usersPage, initialCount)
  })
})
