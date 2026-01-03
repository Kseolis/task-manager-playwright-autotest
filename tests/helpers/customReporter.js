import { getLogger } from './logger.js'

/**
 * Кастомный reporter для Playwright
 * Показывает детальную информацию о выполнении тестов
 */
export default class CustomReporter {
  constructor(options = {}) {
    this.logger = getLogger()
    this.options = options
    this.testResults = []
  }

  onBegin(config, suite) {
    this.logger.info('Test run started', {
      totalTests: suite.allTests().length,
      workers: config.workers,
    })
  }

  onTestBegin(test) {
    this.logger.setTestName(test.title)
    this.logger.info(`Test started: ${test.title}`)
  }

  onTestEnd(test, result) {
    const duration = result.duration
    const status = result.status

    this.testResults.push({
      title: test.title,
      status,
      duration,
      error: result.error ? result.error.message : null,
    })

    if (status === 'passed') {
      this.logger.info(`Test passed: ${test.title} (${duration}ms)`)
    } else if (status === 'failed') {
      this.logger.error(`Test failed: ${test.title}`, {
        error: result.error?.message,
        duration,
      })
    } else if (status === 'skipped') {
      this.logger.warn(`Test skipped: ${test.title}`)
    }

    this.logger.setTestName(null)
  }

  onEnd(result) {
    const passed = this.testResults.filter(r => r.status === 'passed').length
    const failed = this.testResults.filter(r => r.status === 'failed').length
    const skipped = this.testResults.filter(r => r.status === 'skipped').length
    const totalDuration = result.duration

    this.logger.info('Test run completed', {
      total: this.testResults.length,
      passed,
      failed,
      skipped,
      duration: totalDuration,
    })

    if (failed > 0) {
      this.logger.error('Failed tests:', {
        failedTests: this.testResults
          .filter(r => r.status === 'failed')
          .map(r => ({ title: r.title, error: r.error })),
      })
    }

    // Сохраняем логи в файл
    this.logger.saveToFile(`test-run-${Date.now()}.log`)
  }

  printsToStdio() {
    return true
  }
}

