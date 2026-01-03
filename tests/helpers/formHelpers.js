import { expect } from '@playwright/test'
import { TIMEOUTS } from './constants.js'

/**
 * Хелперы для работы с формами
 */

/**
 * Заполняет поле формы
 * @param {Object} fieldLocator - Локатор поля
 * @param {string} value - Значение для заполнения
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function fillFormField(fieldLocator, value, options = {}) {
  const { clear = true, timeout = TIMEOUTS.SHORT } = options

  await fieldLocator.waitFor({ state: 'visible', timeout })
  if (clear) {
    await fieldLocator.clear()
  }
  await fieldLocator.fill(value)
}

/**
 * Заполняет несколько полей формы
 * @param {Object} fields - Объект с полями {fieldName: {locator, value}}
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function fillFormFields(fields, options = {}) {
  const promises = Object.entries(fields).map(([name, { locator, value }]) => {
    return fillFormField(locator, value, options).catch(error => {
      throw new Error(`Failed to fill field ${name}: ${error.message}`)
    })
  })

  await Promise.all(promises)
}

/**
 * Проверяет, что форма отображается и содержит указанные поля
 * @param {Object} formFields - Объект с полями формы {fieldName: locator}
 * @param {Array<string>} expectedFields - Массив имен ожидаемых полей
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function verifyFormFieldsVisible(formFields, expectedFields, options = {}) {
  const { checkSaveButton = true, saveButtonLocator = null, timeout } = options

  for (const fieldName of expectedFields) {
    if (!formFields[fieldName]) {
      throw new Error(`Field ${fieldName} not found in form fields`)
    }

    if (timeout) {
      await expect.soft(formFields[fieldName]).toBeVisible({ timeout })
    } else {
      await expect.soft(formFields[fieldName]).toBeVisible()
    }
  }

  if (checkSaveButton && saveButtonLocator) {
    await expect(saveButtonLocator).toBeVisible()
  }
}

/**
 * Проверяет, что поле формы имеет указанное значение
 * @param {Object} fieldLocator - Локатор поля
 * @param {string} expectedValue - Ожидаемое значение
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function verifyFieldValue(fieldLocator, expectedValue, options = {}) {
  const { timeout = TIMEOUTS.SHORT } = options
  await fieldLocator.waitFor({ state: 'visible', timeout })
  const actualValue = await fieldLocator.inputValue()
  expect(actualValue).toBe(expectedValue)
}

/**
 * Проверяет, что поле формы валидно (не имеет ошибок)
 * @param {Object} fieldLocator - Локатор поля
 * @param {Object} options - Опции
 * @returns {Promise<boolean>} Валидно ли поле
 */
export async function isFieldValid(fieldLocator, options = {}) {
  const { timeout = TIMEOUTS.SHORT } = options
  try {
    await fieldLocator.waitFor({ state: 'visible', timeout })
    // Проверяем наличие класса ошибки или атрибута aria-invalid
    const hasError = await fieldLocator.evaluate(el => {
      return el.hasAttribute('aria-invalid') && el.getAttribute('aria-invalid') === 'true'
    })
    return !hasError
  } catch {
    return false
  }
}

/**
 * Ожидает, пока форма не будет сохранена (исчезнет или появится таблица)
 * @param {Object} page - Playwright page object
 * @param {Object} formLocator - Локатор формы (опционально)
 * @param {Object} tableLocator - Локатор таблицы (опционально)
 * @param {Object} options - Опции
 * @returns {Promise<void>}
 */
export async function waitForFormSubmission(page, formLocator = null, tableLocator = null, options = {}) {
  const { timeout = TIMEOUTS.MEDIUM } = options

  if (tableLocator) {
    await tableLocator.waitFor({ state: 'visible', timeout }).catch(() => {})
  }
  if (formLocator) {
    await formLocator.waitFor({ state: 'hidden', timeout }).catch(() => {})
  }
}

