import { getLogger } from './logger.js'

/**
 * Grafana Metrics Reporter
 *
 * ЗАЧЕМ: Отправляем метрики тестов в Grafana для мониторинга
 * ПОЧЕМУ: Нужна визуализация трендов (execution time, flaky tests, coverage)
 *
 * АЛЬТЕРНАТИВЫ:
 * - Datadog: SaaS, дорого, но удобно
 * - New Relic: для production мониторинга
 * - ELK Stack: если уже используется
 *
 * ВЫБОР: Grafana + InfluxDB - open source, мощно
 */

const logger = getLogger()

export class GrafanaReporter {
  constructor(_options = {}) {
    this.influxUrl = options.influxUrl || process.env.INFLUX_URL || 'http://localhost:8086'
    this.influxDb = options.influxDb || process.env.INFLUX_DB || 'playwright_metrics'
    this.influxToken = options.influxToken || process.env.INFLUX_TOKEN
    this.enabled = process.env.GRAFANA_ENABLED === 'true' || options.enabled
  }

  /**
   * Отправляет метрики в InfluxDB
   * @param {Object} metrics - Метрики для отправки
   */
  async sendMetrics(metrics) {
    if (!this.enabled) {
      logger.debug('Grafana reporting disabled')
      return
    }

    try {
      const lineProtocol = this.convertToLineProtocol(metrics)

      const response = await fetch(`${this.influxUrl}/write?db=${this.influxDb}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          ...(this.influxToken && { Authorization: `Token ${this.influxToken}` }),
        },
        body: lineProtocol,
      })

      if (!response.ok) {
        throw new Error(`InfluxDB write failed: ${response.status} ${response.statusText}`)
      }

      logger.debug('Metrics sent to Grafana', { metrics })
    }
    catch (error) {
      logger.error('Failed to send metrics to Grafana', { error: error.message })
    }
  }

  /**
   * Конвертирует метрики в InfluxDB Line Protocol
   * @param {Object} metrics - Метрики
   * @returns {string} Line Protocol строка
   */
  convertToLineProtocol(metrics) {
    const {
      measurement = 'test_results',
      tags = {},
      fields = {},
      timestamp = Date.now(),
    } = metrics

    // Tags (индексируются, для filtering)
    const tagStr = Object.entries(tags)
      .map(([k, v]) => `${k}=${this.escape(v)}`)
      .join(',')

    // Fields (значения метрик)
    const fieldStr = Object.entries(fields)
      .map(([k, v]) => {
        if (typeof v === 'string') {
          return `${k}="${this.escape(v)}"`
        }
        return `${k}=${v}`
      })
      .join(',')

    // InfluxDB Line Protocol:
    // measurement,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp
    return `${measurement}${tagStr ? ',' + tagStr : ''} ${fieldStr} ${timestamp * 1000000}`
  }

  /**
   * Экранирует специальные символы для Line Protocol
   */
  escape(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\s/g, '\\ ')
      .replace(/,/g, '\\,')
      .replace(/=/g, '\\=')
  }

  /**
   * Отправляет метрики теста
   */
  async reportTestMetrics(testResult) {
    await this.sendMetrics({
      measurement: 'test_execution',
      tags: {
        test_name: testResult.title,
        test_file: testResult.file,
        status: testResult.status,
        browser: testResult.browser || 'chromium',
        env: process.env.CI ? 'ci' : 'local',
      },
      fields: {
        duration_ms: testResult.duration,
        retry_count: testResult.retry || 0,
        passed: testResult.status === 'passed' ? 1 : 0,
        failed: testResult.status === 'failed' ? 1 : 0,
        skipped: testResult.status === 'skipped' ? 1 : 0,
      },
    })
  }

  /**
   * Отправляет summary метрики
   */
  async reportSummary(summary) {
    await this.sendMetrics({
      measurement: 'test_summary',
      tags: {
        env: process.env.CI ? 'ci' : 'local',
        branch: process.env.GIT_BRANCH || 'unknown',
        commit: process.env.GIT_COMMIT || 'unknown',
      },
      fields: {
        total_tests: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        skipped: summary.skipped,
        duration_ms: summary.duration,
        success_rate: summary.passed / summary.total,
      },
    })
  }

  /**
   * Отправляет метрики флейки-тестов
   */
  async reportFlakyTest(testName, failureRate) {
    await this.sendMetrics({
      measurement: 'flaky_tests',
      tags: {
        test_name: testName,
        severity: failureRate > 0.5 ? 'high' : failureRate > 0.2 ? 'medium' : 'low',
      },
      fields: {
        failure_rate: failureRate,
        alert: failureRate > 0.3 ? 1 : 0,
      },
    })
  }

  /**
   * Отправляет метрики coverage
   */
  async reportCoverage(coverage) {
    await this.sendMetrics({
      measurement: 'code_coverage',
      tags: {
        type: coverage.type || 'overall',
      },
      fields: {
        lines: coverage.lines || 0,
        functions: coverage.functions || 0,
        branches: coverage.branches || 0,
        statements: coverage.statements || 0,
      },
    })
  }

  /**
   * Отправляет метрики performance
   */
  async reportPerformance(perfMetrics) {
    await this.sendMetrics({
      measurement: 'performance',
      tags: {
        page: perfMetrics.page,
        metric_type: perfMetrics.type,
      },
      fields: {
        value_ms: perfMetrics.value,
        threshold_ms: perfMetrics.threshold,
        exceeded: perfMetrics.value > perfMetrics.threshold ? 1 : 0,
      },
    })
  }
}

/**
 * DEPRECATED: getGrafanaReporter() использует singleton pattern
 * Для консистентности с apiClient, используйте createGrafanaReporter()
 *
 * @deprecated Use createGrafanaReporter() instead
 */
let _globalReporter = null

export function getGrafanaReporter(options = {}) {
  console.warn('getGrafanaReporter() is deprecated. Use createGrafanaReporter() instead.')
  return createGrafanaReporter(options)
}

/**
 * Создает новый экземпляр GrafanaReporter
 * @param {Object} options - Опции для GrafanaReporter
 * @returns {GrafanaReporter} Новый экземпляр reporter
 */
export function createGrafanaReporter(options = {}) {
  return new GrafanaReporter(options)
}

/**
 * USAGE EXAMPLE:
 *
 * // В custom reporter
 * const grafana = getGrafanaReporter()
 *
 * onTestEnd(test, result) {
 *   await grafana.reportTestMetrics({
 *     title: test.title,
 *     file: test.location.file,
 *     status: result.status,
 *     duration: result.duration,
 *     browser: 'chromium',
 *   })
 * }
 *
 * onEnd(summary) {
 *   await grafana.reportSummary({
 *     total: summary.total,
 *     passed: summary.passed,
 *     failed: summary.failed,
 *     skipped: summary.skipped,
 *     duration: summary.duration,
 *   })
 * }
 */
