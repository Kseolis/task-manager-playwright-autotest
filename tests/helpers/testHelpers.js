import { expect } from '@playwright/test'
import { TIMEOUTS, TEST_CONSTANTS } from './constants.js'

/**
 * Общие хелперы для тестов CRUD операций
 */

/**
 * Получает локатор таблицы из Page Object
 * Использует метод getTableLocator если доступен, иначе fallback на прямые свойства
 * @param {Object} pageObject - Page Object
 * @returns {Object} Локатор таблицы
 */
const getTableLocator = (pageObject) => {
  if (typeof pageObject.getTableLocator === 'function') {
    return pageObject.getTableLocator()
  }
  return pageObject.config?.tableLocator || pageObject.tableLocator || pageObject.usersTable || pageObject.statusesTable || pageObject.labelsTable
}

/**
 * Проверяет, что форма отображается корректно
 * @param {Object} form - Объект формы с полями для проверки
 * @param {Array<string>} fieldNames - Массив имен полей для проверки
 * @param {Object} options - Опции проверки
 * @param {boolean} options.checkSaveButton - Проверять ли кнопку сохранения (по умолчанию true)
 * @param {number} options.timeout - Таймаут для проверки полей (по умолчанию без таймаута, для edit - TIMEOUTS.SHORT)
 */
export const verifyFormVisible = async (form, fieldNames, options = {}) => {
  const { checkSaveButton = true, timeout } = options

  for (const fieldName of fieldNames) {
    if (timeout) {
      await expect.soft(form[fieldName]).toBeVisible({ timeout })
    }
    else {
      await expect.soft(form[fieldName]).toBeVisible()
    }
  }

  if (checkSaveButton && form.saveButton) {
    await expect(form.saveButton).toBeVisible()
  }
}

/**
 * Проверяет, что форма создания отображается корректно
 * @param {Object} form - Объект формы с полями для проверки
 * @param {Array<string>} fieldNames - Массив имен полей для проверки
 */
export const verifyCreateFormVisible = async (form, fieldNames) => {
  await verifyFormVisible(form, fieldNames, { checkSaveButton: true })
}

/**
 * Проверяет, что форма редактирования отображается корректно
 * @param {Object} form - Объект формы с полями для проверки
 * @param {Array<string>} fieldNames - Массив имен полей для проверки
 */
export const verifyEditFormVisible = async (form, fieldNames) => {
  await verifyFormVisible(form, fieldNames, {
    checkSaveButton: true,
    timeout: TIMEOUTS.SHORT,
  })
}

/**
 * Проверяет успешное создание сущности
 * @param {Object} pageObject - Page Object с методами getCount, isVisible
 * @param {number} initialCount - Начальное количество элементов
 * @param {string|Object} identifier - Идентификатор созданной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 */
export const verifyEntityCreated = async (pageObject, initialCount, identifier, isVisibleMethod) => {
  await expect.poll(() => pageObject.getCount(), { timeout: TIMEOUTS.MEDIUM }).toBeGreaterThan(initialCount)
  await expect.poll(() => isVisibleMethod(identifier), { timeout: TIMEOUTS.MEDIUM }).toBe(true)
}

/**
 * Проверяет, что список отображается и содержит элементы
 * @param {Object} pageObject - Page Object с методами goto, tableLocator, getCount
 */
export const verifyListDisplayed = async (pageObject) => {
  await pageObject.goto()
  const tableLocator = getTableLocator(pageObject)
  await expect(tableLocator).toBeVisible()
  const count = await pageObject.getCount()
  await expect(count).toBeGreaterThan(0)
}

/**
 * Проверяет данные строк в списке
 * @param {Array} rows - Массив строк таблицы
 * @param {Function} getRowDataMethod - Метод получения данных строки
 * @param {Array<string>} expectedFields - Массив ожидаемых полей
 */
export const verifyRowsData = async (rows, getRowDataMethod, expectedFields) => {
  expect(rows.length).toBeGreaterThan(0)

  for (let i = 0; i < Math.min(rows.length, TEST_CONSTANTS.MAX_ROWS_TO_CHECK); i++) {
    const rowData = await getRowDataMethod(rows[i])
    for (const field of expectedFields) {
      expect.soft(rowData[field]).toBeTruthy()
    }
  }
}

/**
 * Проверяет успешное редактирование сущности
 * @param {Object} pageObject - Page Object
 * @param {string|Object} identifier - Идентификатор отредактированной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 * @param {Function} verifyMethod - Метод верификации данных
 * @param {Object} expectedData - Ожидаемые данные
 */
export const verifyEntityEdited = async (pageObject, identifier, isVisibleMethod, verifyMethod, expectedData) => {
  await expect.poll(() => isVisibleMethod(identifier), { timeout: TIMEOUTS.MEDIUM }).toBe(true)

  if (verifyMethod) {
    const verification = await verifyMethod(identifier, expectedData)
    for (const value of Object.values(verification)) {
      expect.soft(value).toBe(true)
    }
  }
}

/**
 * Проверяет успешное удаление сущности
 * @param {Object} pageObject - Page Object с методами getCount, isVisible
 * @param {number} initialCount - Начальное количество элементов
 * @param {string|Object} identifier - Идентификатор удаленной сущности
 * @param {Function} isVisibleMethod - Метод проверки видимости
 */
export const verifyEntityDeleted = async (pageObject, initialCount, identifier, isVisibleMethod) => {
  expect(initialCount).toBeGreaterThan(0)
  await expect.poll(() => pageObject.getCount()).toBeLessThan(initialCount)
  await expect.poll(() => isVisibleMethod(identifier)).toBe(false)
}

/**
 * Проверяет успешное массовое удаление
 * @param {Object} pageObject - Page Object с методами getCount, selectAll, deleteAllSelected
 * @param {number} initialCount - Начальное количество элементов
 */
export const verifyBulkDelete = async (pageObject, initialCount) => {
  await pageObject.goto()
  await pageObject.selectAll()
  await pageObject.deleteAllSelected()
  await expect.poll(() => pageObject.getCount()).toBeLessThan(initialCount)
}

/**
 * Проверяет видимость карточки задачи с повторными попытками
 * @param {Function} checkVisibility - Функция проверки видимости
 * @param {boolean} expectedValue - Ожидаемое значение видимости
 */
export const verifyTaskCardVisibility = async (checkVisibility, expectedValue = true) => {
  await expect.poll(checkVisibility, { timeout: TIMEOUTS.MEDIUM }).toBe(expectedValue)
}
