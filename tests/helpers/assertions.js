import { expect } from '@playwright/test'
import { TIMEOUTS } from './constants.js'

/**
 * Расширенные assertion хелперы с понятными сообщениями об ошибках
 */

/**
 * Проверяет, что сущность была создана
 * @param {Object} pageObject - Page Object с методами getCount, isVisible
 * @param {number} initialCount - Начальное количество элементов
 * @param {string|Object} identifier - Идентификатор созданной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectEntityToBeCreated(
  pageObject,
  initialCount,
  identifier,
  isVisibleMethod,
  options = {},
) {
  const { timeout = TIMEOUTS.MEDIUM } = options

  await expect
    .poll(() => pageObject.getCount(), { timeout })
    .toBeGreaterThan(initialCount)

  await expect
    .poll(() => isVisibleMethod(identifier), { timeout })
    .toBe(true)
}

/**
 * Проверяет, что сущность была отредактирована
 * @param {Object} pageObject - Page Object
 * @param {string|Object} identifier - Идентификатор отредактированной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 * @param {Function} verifyMethod - Метод верификации данных
 * @param {Object} expectedData - Ожидаемые данные
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectEntityToBeEdited(
  pageObject,
  identifier,
  isVisibleMethod,
  verifyMethod,
  expectedData,
  options = {},
) {
  const { timeout = TIMEOUTS.MEDIUM } = options

  await expect.poll(() => isVisibleMethod(identifier), { timeout }).toBe(true)

  if (verifyMethod) {
    const verification = await verifyMethod(identifier, expectedData)
    for (const [key, value] of Object.entries(verification)) {
      expect.soft(value, `Field ${key} should match expected value`).toBe(true)
    }
  }
}

/**
 * Проверяет, что сущность была удалена
 * @param {Object} pageObject - Page Object с методами getCount, isVisible
 * @param {number} initialCount - Начальное количество элементов
 * @param {string|Object} identifier - Идентификатор удаленной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectEntityToBeDeleted(
  pageObject,
  initialCount,
  identifier,
  isVisibleMethod,
  options = {},
) {
  expect(initialCount, 'Initial count should be greater than 0').toBeGreaterThan(0)

  await expect.poll(() => pageObject.getCount()).toBeLessThan(initialCount)
  await expect.poll(() => isVisibleMethod(identifier)).toBe(false)
}

/**
 * Проверяет, что список отображается и содержит элементы
 * @param {Object} pageObject - Page Object с методами goto, tableLocator, getCount
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectListToBeDisplayed(pageObject, options = {}) {
  const { minItems = 1 } = options

  await pageObject.goto()
  const tableLocator = pageObject.getTableLocator()
  await expect(tableLocator).toBeVisible()

  const count = await pageObject.getCount()
  expect(count, `List should contain at least ${minItems} items`).toBeGreaterThanOrEqual(minItems)
}

/**
 * Проверяет данные строк в списке
 * @param {Array} rows - Массив строк таблицы
 * @param {Function} getRowDataMethod - Метод получения данных строки
 * @param {Array<string>} expectedFields - Массив ожидаемых полей
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectRowsToHaveData(rows, getRowDataMethod, expectedFields, options = {}) {
  const { maxRowsToCheck = 3 } = options

  expect(rows.length, 'Rows array should not be empty').toBeGreaterThan(0)

  const rowsToCheck = rows.slice(0, Math.min(rows.length, maxRowsToCheck))

  for (let i = 0; i < rowsToCheck.length; i++) {
    const rowData = await getRowDataMethod(rowsToCheck[i])
    for (const field of expectedFields) {
      expect.soft(
        rowData[field],
        `Row ${i} should have field ${field}`,
      ).toBeTruthy()
    }
  }
}

/**
 * Проверяет, что форма отображается корректно
 * @param {Object} formFields - Объект с полями формы
 * @param {Array<string>} expectedFields - Массив ожидаемых полей
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function expectFormToBeVisible(formFields, expectedFields, options = {}) {
  const { checkSaveButton = true, saveButtonLocator = null, timeout } = options

  for (const fieldName of expectedFields) {
    if (!formFields[fieldName]) {
      throw new Error(`Field ${fieldName} not found in form`)
    }

    if (timeout) {
      await expect.soft(formFields[fieldName], `Field ${fieldName} should be visible`).toBeVisible({ timeout })
    } else {
      await expect.soft(formFields[fieldName], `Field ${fieldName} should be visible`).toBeVisible()
    }
  }

  if (checkSaveButton && saveButtonLocator) {
    await expect(saveButtonLocator, 'Save button should be visible').toBeVisible()
  }
}

