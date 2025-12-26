import { LoginPage } from '../pages/LoginPage.js'
import { testUsers } from './testData.js'

export const loginUser = async (page, user = testUsers.valid) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(user.login, user.password)
  return loginPage
}

export const loginAsValidUser = async (page) => {
  return await loginUser(page, testUsers.valid)
}
