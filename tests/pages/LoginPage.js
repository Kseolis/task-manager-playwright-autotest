export class LoginPage {
  constructor(page) {
    this.page = page
    this.loginInput = page.locator('input[name="username"]').first()
    this.passwordInput = page.locator('input[type="password"]').first()
    this.submitButton = page.locator('button[type="submit"]:has-text("Sign in")').first()
    this.logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first()
  }

  async goto() {
    await this.page.goto('/')
  }

  async login(login, password) {
    await this.loginInput.fill(login)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async isLoginFormVisible() {
    await this.page.waitForSelector('input[type="password"]', { state: 'visible' })
    return (await this.loginInput.isVisible()) && (await this.passwordInput.isVisible())
  }

  async logout() {
    await this.page.locator('button[aria-label="Profile"]').click()
    await this.page.waitForTimeout(500)
    await this.page.locator('[role="menuitem"]:has-text("Logout")').click()
  }

  async isLoggedIn() {
    const isFormVisible = await this.loginInput.isVisible().catch(() => false)
    return !isFormVisible
  }

  async isLoggedOut() {
    return this.isLoginFormVisible()
  }
}
