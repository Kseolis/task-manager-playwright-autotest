import { BasePage } from './BasePage.js'
import { URLS, SELECTORS, COLUMN_INDEXES } from '../helpers/constants.js'

export class StatusesPage extends BasePage {
  constructor(page) {
    const statusesTable = page.locator(SELECTORS.TABLE)
    super(page, {
      url: URLS.STATUSES,
      tableLocator: statusesTable,
      createButtonLocator: page.locator(SELECTORS.STATUSES_CREATE_BUTTON),
      firstInputLocator: page.locator(SELECTORS.STATUS_NAME_INPUT),
      selectAllCheckboxLocator: page.locator(SELECTORS.SELECT_ALL_CHECKBOX).first(),
      deleteButtonLocator: page.locator(SELECTORS.DELETE_BUTTON),
    })
    this.page = page
    this.statusesTable = statusesTable
  }

  async clickCreate() {
    await super.clickCreate()
  }

  async fillStatusForm(statusData) {
    const nameInput = this.page.locator(SELECTORS.STATUS_NAME_INPUT)
    const slugInput = this.page.locator(SELECTORS.STATUS_SLUG_INPUT)

    if (statusData.name) {
      await nameInput.fill(statusData.name)
    }
    if (statusData.slug) {
      await slugInput.fill(statusData.slug)
    }
  }

  async saveStatus() {
    await super.saveForm()
  }

  async getStatusRowBySlug(slug) {
    return await super.getRowLocatorByCellText(slug, COLUMN_INDEXES.SLUG)
  }

  async getStatusCheckboxBySlug(slug) {
    return await super.getCheckboxByCellText(slug, COLUMN_INDEXES.SLUG)
  }

  async clickEditStatus(slug) {
    const row = await this.getStatusRowBySlug(slug)
    const statusId = await super.getIdFromRow(row)
    await super.gotoEditPage(statusId)
  }

  async deleteStatus(slug) {
    await super.deleteByCellText(slug, COLUMN_INDEXES.SLUG)
  }

  async selectAllStatuses() {
    await super.selectAll()
  }

  async deleteAllSelected() {
    await super.deleteAllSelected()
  }

  async getStatusCount() {
    return await super.getCount()
  }

  async getStatusData(slug) {
    const row = await this.getStatusRowBySlug(slug)
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()

    return {
      id: (await cells[COLUMN_INDEXES.ID]?.textContent())?.trim(),
      name: (await cells[COLUMN_INDEXES.NAME]?.textContent())?.trim(),
      slug: (await cells[COLUMN_INDEXES.SLUG]?.textContent())?.trim(),
    }
  }

  async isStatusVisible(slug) {
    const row = await this.getStatusRowBySlug(slug)
    return await row.isVisible().catch(() => false)
  }

  async getFirstStatusSlug() {
    const firstRow = this.page.locator(SELECTORS.TABLE_BODY_ROW).first()
    return await firstRow.locator(SELECTORS.TABLE_CELL).nth(COLUMN_INDEXES.SLUG).textContent()
  }

  async isCreateFormVisible() {
    await Promise.all([
      this.page.locator(SELECTORS.STATUS_NAME_INPUT).waitFor({ state: 'visible' }),
      this.page.locator(SELECTORS.STATUS_SLUG_INPUT).waitFor({ state: 'visible' }),
    ])
    return {
      name: this.page.locator(SELECTORS.STATUS_NAME_INPUT),
      slug: this.page.locator(SELECTORS.STATUS_SLUG_INPUT),
      saveButton: this.getSaveButton(),
    }
  }

  async isEditFormVisible() {
    return await this.isCreateFormVisible()
  }

  async createStatus(statusData) {
    await this.goto()
    const initialCount = await this.getStatusCount()
    await this.clickCreate()
    await this.fillStatusForm(statusData)
    await this.saveStatus()
    await this.goto()
    return { initialCount, statusData }
  }

  async editStatus(slug, editedData) {
    await this.goto()
    await this.clickEditStatus(slug)
    await this.fillStatusForm(editedData)
    await this.saveStatus()
    await this.goto()
    return editedData
  }

  async verifyStatusData(slug, expectedData) {
    const savedStatus = await this.getStatusData(slug)
    return {
      name: savedStatus.name?.includes(expectedData.name),
      slug: savedStatus.slug?.includes(expectedData.slug),
    }
  }

  async getAllStatusRows() {
    return await super.getAllRows()
  }

  async getStatusRowData(row) {
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()
    return {
      name: await cells[COLUMN_INDEXES.NAME]?.textContent(),
      slug: await cells[COLUMN_INDEXES.SLUG]?.textContent(),
    }
  }

  async areAllCheckboxesSelected() {
    return await super.areAllCheckboxesSelected()
  }

  async deleteFirstStatus() {
    await this.goto()
    const initialCount = await this.getStatusCount()
    const firstStatusSlug = await this.getFirstStatusSlug()
    await this.deleteStatus(firstStatusSlug)
    return { initialCount, firstStatusSlug }
  }
}
