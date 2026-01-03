import { getApiClient } from './helpers/apiClient.js'

/**
 * Global setup для тестов
 * Выполняется один раз перед всеми тестами
 */
async function globalSetup() {
  console.log('Running global setup...')

  // Проверяем доступность API
  const apiClient = getApiClient()
  try {
    // Попытка получить список пользователей для проверки доступности API
    await apiClient.getUsers()
    console.log('API is available')
  } catch (error) {
    console.warn('API might not be available:', error.message)
    // Не падаем, так как тесты могут работать и без API
  }
}

export default globalSetup

