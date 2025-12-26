import { test, expect } from '@playwright/test'
import { StatusesPage } from './pages/StatusesPage.js'
import { generateStatusData, generateEditedStatusData } from './helpers/testData.js'
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

test.describe('Создание статусов', () => {
  test('форма создания статуса отображается корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    await statusesPage.clickCreate()

    const form = await statusesPage.isCreateFormVisible()
    await verifyCreateFormVisible(form, ['name', 'slug'])
  })

  test('создание нового статуса с валидными данными', async ({ page }) => {
    const statusesPage = new StatusesPage(page)
    const statusData = generateStatusData()

    const { initialCount } = await statusesPage.createStatus(statusData)

    await verifyEntityCreated(
      statusesPage,
      initialCount,
      statusData.slug,
      slug => statusesPage.isStatusVisible(slug),
    )

    const verification = await statusesPage.verifyStatusData(statusData.slug, statusData)
    await expect.soft(verification.name).toBe(true)
    await expect.soft(verification.slug).toBe(true)
  })
})

test.describe('Просмотр списка статусов', () => {
  test('список статусов отображается полностью и корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)
    await verifyListDisplayed(statusesPage)
  })

  test('отображается основная информация о каждом статусе', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    const rows = await statusesPage.getAllStatusRows()

    await verifyRowsData(rows, row => statusesPage.getStatusRowData(row), ['name', 'slug'])
  })
})

test.describe('Редактирование статусов', () => {
  test('форма редактирования статуса отображается правильно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    const firstStatusSlug = await statusesPage.getFirstStatusSlug()
    await expect(firstStatusSlug).toBeTruthy()

    await statusesPage.clickEditStatus(firstStatusSlug)
    const form = await statusesPage.isEditFormVisible()
    await verifyEditFormVisible(form, ['name', 'slug'])
  })

  test('изменение данных статуса сохраняется корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)
    const editedData = generateEditedStatusData()

    await statusesPage.goto()
    const firstStatusSlug = await statusesPage.getFirstStatusSlug()
    await expect(firstStatusSlug).toBeTruthy()

    await statusesPage.editStatus(firstStatusSlug, editedData)
    await verifyEntityEdited(
      statusesPage,
      editedData.slug,
      slug => statusesPage.isStatusVisible(slug),
      (slug, data) => statusesPage.verifyStatusData(slug, data),
      editedData,
    )
  })
})

test.describe('Удаление статусов', () => {
  test('удаление одного статуса', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    const { initialCount, firstStatusSlug } = await statusesPage.deleteFirstStatus()

    await verifyEntityDeleted(
      statusesPage,
      initialCount,
      firstStatusSlug,
      slug => statusesPage.isStatusVisible(slug),
    )
  })
})

test.describe('Массовое удаление статусов', () => {
  test('выделение всех статусов', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    await statusesPage.selectAllStatuses()

    await expect.poll(() => statusesPage.areAllCheckboxesSelected()).toBe(true)
  })

  test('массовое удаление всех статусов', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    const initialCount = await statusesPage.getStatusCount()
    await verifyBulkDelete(statusesPage, initialCount)
  })
})
