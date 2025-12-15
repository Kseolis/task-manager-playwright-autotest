import { test, expect } from '@playwright/test'
import { StatusesPage } from './pages/StatusesPage.js'
import { generateStatusData, generateEditedStatusData } from './helpers/testData.js'
import { loginAsValidUser } from './helpers/authHelper.js'
import { TIMEOUTS, TEST_CONSTANTS } from './helpers/constants.js'

test.beforeEach(async ({ page }) => {
  await loginAsValidUser(page)
})

test.describe('Создание статусов', () => {
  test('форма создания статуса отображается корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()
    await statusesPage.clickCreate()

    const form = await statusesPage.isCreateFormVisible()
    await expect.soft(form.name).toBeVisible()
    await expect.soft(form.slug).toBeVisible()
    await expect(form.saveButton).toBeVisible()
  })

  test('создание нового статуса с валидными данными', async ({ page }) => {
    const statusesPage = new StatusesPage(page)
    const statusData = generateStatusData()

    const { initialCount } = await statusesPage.createStatus(statusData)

    await expect.poll(() => statusesPage.getStatusCount(), { timeout: TIMEOUTS.MEDIUM }).toBeGreaterThan(initialCount)
    await expect.poll(() => statusesPage.isStatusVisible(statusData.slug), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

    const verification = await statusesPage.verifyStatusData(statusData.slug, statusData)
    await expect.soft(verification.name).toBe(true)
    await expect.soft(verification.slug).toBe(true)
  })
})

test.describe('Просмотр списка статусов', () => {
  test('список статусов отображается полностью и корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()

    await expect(statusesPage.statusesTable).toBeVisible()
    const statusCount = await statusesPage.getStatusCount()
    await expect(statusCount).toBeGreaterThan(0)
  })

  test('отображается основная информация о каждом статусе', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    await statusesPage.goto()

    const rows = await statusesPage.getAllStatusRows()
    await expect(rows.length).toBeGreaterThan(0)

    for (let i = 0; i < Math.min(rows.length, TEST_CONSTANTS.MAX_ROWS_TO_CHECK); i++) {
      const statusData = await statusesPage.getStatusRowData(rows[i])
      await expect.soft(statusData.name).toBeTruthy()
      await expect.soft(statusData.slug).toBeTruthy()
    }
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
    await expect.soft(form.name).toBeVisible({ timeout: TIMEOUTS.SHORT })
    await expect.soft(form.slug).toBeVisible({ timeout: TIMEOUTS.SHORT })
  })

  test('изменение данных статуса сохраняется корректно', async ({ page }) => {
    const statusesPage = new StatusesPage(page)
    const editedData = generateEditedStatusData()

    await statusesPage.goto()
    const firstStatusSlug = await statusesPage.getFirstStatusSlug()
    await expect(firstStatusSlug).toBeTruthy()

    await statusesPage.editStatus(firstStatusSlug, editedData)

    await expect.poll(() => statusesPage.isStatusVisible(editedData.slug), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

    const verification = await statusesPage.verifyStatusData(editedData.slug, editedData)
    await expect.soft(verification.name).toBe(true)
    await expect.soft(verification.slug).toBe(true)
  })
})

test.describe('Удаление статусов', () => {
  test('удаление одного статуса', async ({ page }) => {
    const statusesPage = new StatusesPage(page)

    const { initialCount, firstStatusSlug } = await statusesPage.deleteFirstStatus()

    await expect(initialCount).toBeGreaterThan(0)
    await expect.poll(() => statusesPage.getStatusCount()).toBeLessThan(initialCount)
    await expect.poll(() => statusesPage.isStatusVisible(firstStatusSlug)).toBe(false)
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
    await statusesPage.selectAllStatuses()
    await statusesPage.deleteAllSelected()
    await expect.poll(() => statusesPage.getStatusCount()).toBeLessThan(initialCount)
  })
})
