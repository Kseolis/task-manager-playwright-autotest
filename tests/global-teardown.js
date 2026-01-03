/**
 * Global teardown для тестов
 * Выполняется один раз после всех тестов
 */
async function globalTeardown() {
  console.log('Running global teardown...')
  // Здесь можно добавить финальную очистку, если нужно
}

export default globalTeardown

