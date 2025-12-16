import { BasePage } from './BasePage.js'
import { URLS, SELECTORS, COLUMN_INDEXES } from '../helpers/constants.js'

export class LabelsPage extends BasePage {
  constructor(page) {
    const labelsTable = page.locator(SELECTORS.TABLE)
    super(page, {
      url: URLS.LABELS,
      tableLocator: labelsTable,
      createButtonLocator: page.locator(SELECTORS.LABELS_CREATE_BUTTON),
      firstInputLocator: page.locator(SELECTORS.LABEL_NAME_INPUT),
      selectAllCheckboxLocator: page.locator(SELECTORS.SELECT_ALL_CHECKBOX).first(),
      deleteButtonLocator: page.locator(SELECTORS.DELETE_BUTTON),
    })
    this.page = page
    this.labelsTable = labelsTable
  }

  async clickCreate() {
    await super.clickCreate()
  }

  async fillLabelForm(labelData) {
    const nameInput = this.page.locator(SELECTORS.LABEL_NAME_INPUT)

    if (labelData.name) {
      await nameInput.fill(labelData.name)
    }
  }

  async saveLabel() {
    await super.saveForm()
  }

  async getLabelRowByName(name) {
    return await super.getRowLocatorByCellText(name, COLUMN_INDEXES.NAME)
  }

  async clickEditLabel(name) {
    const row = await this.getLabelRowByName(name)
    const labelId = await super.getIdFromRow(row)
    await super.gotoEditPage(labelId)
  }

  async deleteLabel(name) {
    await super.deleteByCellText(name, COLUMN_INDEXES.NAME)
  }

  async selectAllLabels() {
    await super.selectAll()
  }

  async deleteAllSelected() {
    await super.deleteAllSelected()
  }

  async getLabelCount() {
    return await super.getCount()
  }

  async getLabelData(name) {
    const row = await this.getLabelRowByName(name)
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()

    return {
      id: (await cells[COLUMN_INDEXES.ID]?.textContent())?.trim(),
      name: (await cells[COLUMN_INDEXES.NAME]?.textContent())?.trim(),
    }
  }

  async isLabelVisible(name) {
    const row = await this.getLabelRowByName(name)
    return await row.isVisible().catch(() => false)
  }

  async getFirstLabelName() {
    const firstRow = this.page.locator(SELECTORS.TABLE_BODY_ROW).first()
    return await firstRow.locator(SELECTORS.TABLE_CELL).nth(COLUMN_INDEXES.NAME).textContent()
  }

  async isCreateFormVisible() {
    await this.page.locator(SELECTORS.LABEL_NAME_INPUT).waitFor({ state: 'visible' })
    return {
      name: this.page.locator(SELECTORS.LABEL_NAME_INPUT),
      saveButton: this.getSaveButton(),
    }
  }

  async isEditFormVisible() {
    return await this.isCreateFormVisible()
  }

  async createLabel(labelData) {
    await this.goto()
    const initialCount = await this.getLabelCount()
    await this.clickCreate()
    await this.fillLabelForm(labelData)
    await this.saveLabel()
    await this.goto()
    return { initialCount, labelData }
  }

  async editLabel(name, editedData) {
    await this.goto()
    await this.clickEditLabel(name)
    await this.fillLabelForm(editedData)
    await this.saveLabel()
    await this.goto()
    return editedData
  }

  async verifyLabelData(name, expectedData) {
    const savedLabel = await this.getLabelData(name)
    return {
      name: savedLabel.name?.includes(expectedData.name),
    }
  }

  async getAllLabelRows() {
    return await super.getAllRows()
  }

  async getLabelRowData(row) {
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()
    return {
      name: await cells[COLUMN_INDEXES.NAME]?.textContent(),
    }
  }

  async areAllCheckboxesSelected() {
    return await super.areAllCheckboxesSelected()
  }

  async deleteFirstLabel() {
    await this.goto()
    const initialCount = await this.getLabelCount()
    const firstLabelName = await this.getFirstLabelName()
    await this.deleteLabel(firstLabelName)
    return { initialCount, firstLabelName }
  }
}
