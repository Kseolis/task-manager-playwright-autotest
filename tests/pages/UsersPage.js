import { BasePage } from './BasePage.js'
import { URLS, SELECTORS, COLUMN_INDEXES, TIMEOUTS } from '../helpers/constants.js'

export class UsersPage extends BasePage {
  constructor(page) {
    const usersTable = page.locator(SELECTORS.TABLE)
    super(page, {
      url: URLS.USERS,
      tableLocator: usersTable,
      createButtonLocator: page.locator(SELECTORS.USERS_CREATE_BUTTON),
      firstInputLocator: page.locator(SELECTORS.USER_EMAIL_INPUT),
      selectAllCheckboxLocator: page.locator(SELECTORS.SELECT_ALL_CHECKBOX).first(),
      deleteButtonLocator: page.locator(SELECTORS.DELETE_BUTTON),
    })
    this.page = page
    this.usersTable = usersTable
  }

  async clickCreate() {
    await super.clickCreate()
  }

  async fillUserForm(userData) {
    const emailInput = this.page.locator(SELECTORS.USER_EMAIL_INPUT)
    const firstNameInput = this.page.locator(SELECTORS.USER_FIRST_NAME_INPUT)
    const lastNameInput = this.page.locator(SELECTORS.USER_LAST_NAME_INPUT)

    if (userData.email) {
      await emailInput.fill(userData.email)
    }
    if (userData.firstName) {
      await firstNameInput.fill(userData.firstName)
    }
    if (userData.lastName) {
      await lastNameInput.fill(userData.lastName)
    }
  }

  async saveUser() {
    await super.saveForm()
  }

  async getUserRowByEmail(email) {
    return await super.getRowLocatorByCellText(email, COLUMN_INDEXES.EMAIL)
  }

  async getUserCheckboxByEmail(email) {
    return await super.getCheckboxByCellText(email, COLUMN_INDEXES.EMAIL)
  }

  async clickEditUser(email) {
    const row = await this.getUserRowByEmail(email)
    const userId = await super.getIdFromRow(row)
    await super.gotoEditPage(userId)
  }

  async deleteUser(email) {
    await super.deleteByCellText(email, COLUMN_INDEXES.EMAIL)
  }

  async selectAllUsers() {
    await super.selectAll()
  }

  async deleteAllSelected() {
    await super.deleteAllSelected()
  }

  async getUserCount() {
    return await super.getCount()
  }

  async getUserData(email) {
    const row = await this.getUserRowByEmail(email)
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()

    return {
      id: (await cells[COLUMN_INDEXES.ID]?.textContent())?.trim(),
      email: (await cells[COLUMN_INDEXES.EMAIL]?.textContent())?.trim(),
      firstName: (await cells[COLUMN_INDEXES.FIRST_NAME]?.textContent())?.trim(),
      lastName: (await cells[COLUMN_INDEXES.LAST_NAME]?.textContent())?.trim(),
    }
  }

  async isUserVisible(email) {
    const row = await this.getUserRowByEmail(email)
    return await row.isVisible().catch(() => false)
  }

  async getFirstUserEmail() {
    const firstRow = this.page.locator(SELECTORS.TABLE_BODY_ROW).first()
    return await firstRow.locator(SELECTORS.TABLE_CELL).nth(COLUMN_INDEXES.EMAIL).textContent()
  }

  async isCreateFormVisible() {
    await Promise.all([
      this.page.locator(SELECTORS.USER_EMAIL_INPUT).waitFor({ state: 'visible' }),
      this.page.locator(SELECTORS.USER_FIRST_NAME_INPUT).waitFor({ state: 'visible' }),
      this.page.locator(SELECTORS.USER_LAST_NAME_INPUT).waitFor({ state: 'visible' }),
    ])
    return {
      email: this.page.locator(SELECTORS.USER_EMAIL_INPUT),
      firstName: this.page.locator(SELECTORS.USER_FIRST_NAME_INPUT),
      lastName: this.page.locator(SELECTORS.USER_LAST_NAME_INPUT),
      saveButton: this.getSaveButton(),
    }
  }

  async isEditFormVisible() {
    return await this.isCreateFormVisible()
  }

  async createUser(userData) {
    await this.goto()
    const initialCount = await this.getUserCount()
    await this.clickCreate()
    await this.fillUserForm(userData)
    await this.saveUser()
    await this.goto()
    return { initialCount, userData }
  }

  async editUser(email, editedData) {
    await this.goto()
    await this.clickEditUser(email)
    await this.fillUserForm(editedData)
    await this.saveUser()
    await this.goto()
    return editedData
  }

  async verifyUserData(email, expectedData) {
    const savedUser = await this.getUserData(email)
    return {
      email: savedUser.email?.includes(expectedData.email),
      firstName: savedUser.firstName?.includes(expectedData.firstName),
      lastName: savedUser.lastName?.includes(expectedData.lastName),
    }
  }

  async fillInvalidEmail(email) {
    const emailInput = this.page.locator(SELECTORS.USER_EMAIL_INPUT)
    await emailInput.fill(email)
    await this.page.locator(SELECTORS.SAVE_BUTTON).click()
    await this.page.locator(SELECTORS.USER_EMAIL_INPUT).waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
    return {
      emailInput,
      getInputValue: () => emailInput.inputValue(),
    }
  }

  async isEditPage() {
    const currentUrl = this.page.url()
    return currentUrl.includes(URLS.EDIT_SUFFIX)
  }

  async getAllUserRows() {
    return await super.getAllRows()
  }

  async getUserRowData(row) {
    const cells = await row.locator(SELECTORS.TABLE_CELL).all()
    return {
      email: await cells[COLUMN_INDEXES.EMAIL]?.textContent(),
      firstName: await cells[COLUMN_INDEXES.FIRST_NAME]?.textContent(),
      lastName: await cells[COLUMN_INDEXES.LAST_NAME]?.textContent(),
    }
  }

  async areAllCheckboxesSelected() {
    return await super.areAllCheckboxesSelected()
  }

  async deleteFirstUser() {
    await this.goto()
    const initialCount = await this.getUserCount()
    const firstUserEmail = await this.getFirstUserEmail()
    await this.deleteUser(firstUserEmail)
    return { initialCount, firstUserEmail }
  }
}
