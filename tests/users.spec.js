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

test.beforeEach(async ({ page }) => {
  await loginAsValidUser(page)
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
    const usersPage = new UsersPage(page)
    const userData = generateUserData()

    const { initialCount } = await usersPage.createUser(userData)

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
    const usersPage = new UsersPage(page)

    await usersPage.goto()
    const firstUserEmail = await usersPage.getFirstUserEmail()
    await expect(firstUserEmail).toBeTruthy()

    await usersPage.clickEditUser(firstUserEmail)
    const form = await usersPage.isEditFormVisible()
    await verifyEditFormVisible(form, ['email', 'firstName', 'lastName'])
  })

  test('изменение данных пользователя сохраняется корректно', async ({ page }) => {
    const usersPage = new UsersPage(page)
    const editedData = generateEditedUserData()

    await usersPage.goto()
    const firstUserEmail = await usersPage.getFirstUserEmail()
    await expect(firstUserEmail).toBeTruthy()

    await usersPage.editUser(firstUserEmail, editedData)
    await verifyEntityEdited(
      usersPage,
      editedData.email,
      email => usersPage.isUserVisible(email),
      (email, data) => usersPage.verifyUserData(email, data),
      editedData,
    )
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

    await verifyEntityDeleted(
      usersPage,
      initialCount,
      firstUserEmail,
      email => usersPage.isUserVisible(email),
    )
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
