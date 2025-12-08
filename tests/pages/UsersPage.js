export class UsersPage {
  constructor(page) {
    this.page = page
    this.createButton = page.locator('a[href="#/users/create"]')
    this.usersTable = page.locator('table')
    this.selectAllCheckbox = page.locator('input[type="checkbox"]').first()
    this.deleteButton = page.locator('button[aria-label="Delete"]')
    this.exportButton = page.locator('button[aria-label="Export"]')
  }

  async goto() {
    await this.page.goto('/#/users')
    await this.page.waitForTimeout(2000)
  }

  async clickCreate() {
    await this.createButton.click()
    await this.page.waitForTimeout(1000)
  }

  async fillUserForm(userData) {
    const emailInput = this.page.locator('input[name="email"]')
    const firstNameInput = this.page.locator('input[name="firstName"]')
    const lastNameInput = this.page.locator('input[name="lastName"]')

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
    await this.page.locator('button[type="submit"], button[aria-label="Save"]').click()
    await this.page.waitForTimeout(2000)
  }

  async getUserRowByEmail(email) {
    return this.page.locator(`tr:has-text("${email}")`)
  }

  async getUserCheckboxByEmail(email) {
    const row = await this.getUserRowByEmail(email)
    return row.locator('td').first().locator('input[type="checkbox"]')
  }

  async clickEditUser(email) {
    const row = await this.getUserRowByEmail(email)
    const userId = await row.locator('td').nth(1).textContent()
    await this.page.goto(`/#/users/${userId}/edit`)
    await this.page.waitForTimeout(2000)
  }

  async deleteUser(email) {
    const checkbox = await this.getUserCheckboxByEmail(email)
    await checkbox.check()
    await this.deleteButton.click()
    await this.page.waitForTimeout(2000)
  }

  async selectAllUsers() {
    await this.selectAllCheckbox.check()
    await this.page.waitForTimeout(500)
  }

  async deleteAllSelected() {
    await this.deleteButton.click()
    await this.page.waitForTimeout(2000)
  }

  async getUserCount() {
    const rows = await this.page.locator('tbody tr').all()
    return rows.length
  }

  async getUserData(email) {
    const row = await this.getUserRowByEmail(email)
    const cells = await row.locator('td').all()

    return {
      id: (await cells[1]?.textContent())?.trim(),
      email: (await cells[2]?.textContent())?.trim(),
      firstName: (await cells[3]?.textContent())?.trim(),
      lastName: (await cells[4]?.textContent())?.trim(),
    }
  }

  async isUserVisible(email) {
    const row = await this.getUserRowByEmail(email)
    return await row.isVisible().catch(() => false)
  }

  async getFirstUserEmail() {
    const firstRow = this.page.locator('tbody tr').first()
    return await firstRow.locator('td').nth(2).textContent()
  }

  async isCreateFormVisible() {
    await Promise.all([
      this.page.locator('input[name="email"]').waitFor({ state: 'visible' }),
      this.page.locator('input[name="firstName"]').waitFor({ state: 'visible' }),
      this.page.locator('input[name="lastName"]').waitFor({ state: 'visible' }),
    ])
    return {
      email: this.page.locator('input[name="email"]'),
      firstName: this.page.locator('input[name="firstName"]'),
      lastName: this.page.locator('input[name="lastName"]'),
      saveButton: this.page.locator('button[type="submit"], button[aria-label="Save"]'),
    }
  }

  async isEditFormVisible() {
    await this.page.waitForTimeout(1000)
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
    await this.page.waitForTimeout(1000)
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
    const emailInput = this.page.locator('input[name="email"]')
    await emailInput.fill(email)
    await this.page.locator('button[type="submit"], button[aria-label="Save"]').click()
    await this.page.waitForTimeout(2000)
    return {
      emailInput,
      getInputValue: () => emailInput.inputValue(),
    }
  }

  async isEditPage() {
    const currentUrl = this.page.url()
    return currentUrl.includes('/edit')
  }

  async getAllUserRows() {
    return await this.page.locator('tbody tr').all()
  }

  async getUserRowData(row) {
    const cells = await row.locator('td').all()
    return {
      email: await cells[2]?.textContent(),
      firstName: await cells[3]?.textContent(),
      lastName: await cells[4]?.textContent(),
    }
  }

  async areAllCheckboxesSelected() {
    const checkboxes = await this.page.locator('tbody input[type="checkbox"]').all()
    const checkedStates = await Promise.all(checkboxes.map(cb => cb.isChecked()))
    return checkedStates.every(state => state === true)
  }

  async deleteFirstUser() {
    await this.goto()
    const initialCount = await this.getUserCount()
    const firstUserEmail = await this.getFirstUserEmail()
    const checkbox = await this.getUserCheckboxByEmail(firstUserEmail)
    await checkbox.check()
    await this.deleteButton.click()
    await this.page.waitForTimeout(2000)
    return { initialCount, firstUserEmail }
  }
}
