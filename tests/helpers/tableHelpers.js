import { expect } from '@playwright/test'
import { SELECTORS, COLUMN_INDEXES } from './constants.js'

/**
 * Хелперы для работы с таблицами
 */

/**
 * Получает все строки таблицы
 * @param {Object} page - Playwright page object
 * @param {Object} tableLocator - Локатор таблицы (опционально)
 * @returns {Promise<Array>} Массив строк
 */
export async function getAllTableRows(page, tableLocator = null) {
  const table = tableLocator || page.locator(SELECTORS.TABLE)
  return await table.locator(SELECTORS.TABLE_BODY_ROW).all()
}

/**
 * Получает количество строк в таблице
 * @param {Object} page - Playwright page object
 * @param {Object} tableLocator - Локатор таблицы (опционально)
 * @returns {Promise<number>} Количество строк
 */
export async function getTableRowCount(page, tableLocator = null) {
  const rows = await getAllTableRows(page, tableLocator)
  return rows.length
}

/**
 * Получает данные ячейки по индексу строки и колонки
 * @param {Object} row - Локатор строки
 * @param {number} columnIndex - Индекс колонки
 * @returns {Promise<string>} Текст ячейки
 */
export async function getCellText(row, columnIndex) {
  return await row.locator(SELECTORS.TABLE_CELL).nth(columnIndex).textContent()
}

/**
 * Получает данные строки по индексам колонок
 * @param {Object} row - Локатор строки
 * @param {Object} columnIndexes - Объект с индексами колонок {fieldName: index}
 * @returns {Promise<Object>} Объект с данными строки
 */
export async function getRowData(row, columnIndexes) {
  const cells = await row.locator(SELECTORS.TABLE_CELL).all()
  const data = {}
  for (const [key, index] of Object.entries(columnIndexes)) {
    data[key] = (await cells[index]?.textContent())?.trim()
  }
  return data
}

/**
 * Находит строку по тексту в указанной колонке
 * @param {Object} page - Playwright page object
 * @param {string} text - Текст для поиска
 * @param {number} columnIndex - Индекс колонки
 * @returns {Object} Локатор строки
 */
export function findRowByCellText(page, text, columnIndex) {
  const quotedText = JSON.stringify(String(text))
  const columnNumber = Number(columnIndex) + 1
  return page.locator(`tbody tr:has(td:nth-child(${columnNumber}):has-text(${quotedText}))`)
}

/**
 * Проверяет, что строка существует в таблице
 * @param {Object} page - Playwright page object
 * @param {string} text - Текст для поиска
 * @param {number} columnIndex - Индекс колонки
 * @returns {Promise<boolean>} Существует ли строка
 */
export async function isRowVisible(page, text, columnIndex) {
  const row = findRowByCellText(page, text, columnIndex)
  return await row.isVisible().catch(() => false)
}

/**
 * Получает чекбокс строки
 * @param {Object} row - Локатор строки
 * @returns {Object} Локатор чекбокса
 */
export function getRowCheckbox(row) {
  return row.locator(SELECTORS.TABLE_CELL).nth(COLUMN_INDEXES.CHECKBOX).locator(SELECTORS.TABLE_CELL_CHECKBOX)
}

/**
 * Выделяет строку по тексту в колонке
 * @param {Object} page - Playwright page object
 * @param {string} text - Текст для поиска
 * @param {number} columnIndex - Индекс колонки
 * @returns {Promise<void>}
 */
export async function selectRowByCellText(page, text, columnIndex) {
  const row = findRowByCellText(page, text, columnIndex)
  const checkbox = getRowCheckbox(row)
  await checkbox.check()
}

