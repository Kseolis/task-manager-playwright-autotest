import { SELECTORS, TIMEOUTS, URLS } from '../helpers/constants.js'

export class TasksPage {
  constructor(page) {
    this.page = page
  }

  async openFromMenu() {
    await this.page.getByRole('menuitem', { name: 'Tasks' }).click()
    await this.page.getByRole('heading', { name: 'Tasks', level: 6 }).waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
  }

  async goto() {
    await this.page.goto(URLS.TASKS)
    await this.page.getByRole('heading', { name: 'Tasks', level: 6 }).first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
  }

  getCreateButton() {
    return this.page.locator(SELECTORS.TASKS_CREATE_BUTTON).first()
  }

  getTitleInput() {
    return this.page.locator(SELECTORS.TASK_TITLE_INPUT).first()
  }

  getContentInput() {
    return this.page.locator(SELECTORS.TASK_CONTENT_INPUT).first()
  }

  async openCreateForm() {
    await this.goto()
    const createButton = this.getCreateButton()
    await createButton.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
    await createButton.click()
    await this.getTitleInput().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
  }

  async fillTaskForm(taskData) {
    if (taskData.title) {
      await this.getTitleInput().fill(taskData.title)
    }
    if (taskData.content) {
      await this.getContentInput().fill(taskData.content)
    }
  }

  getSaveButton() {
    return this.page.locator(SELECTORS.SAVE_BUTTON).first()
  }

  getExportButton() {
    return this.page.locator(SELECTORS.EXPORT_BUTTON).first()
  }

  async saveTask() {
    await this.getSaveButton().click()
  }

  getTaskCardContainerByTitle(title) {
    const escaped = title.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    return this.page.getByRole('button', { name: new RegExp(String.raw`\b${escaped}\b`) }).first()
  }

  async getTaskCardDraggableByTitle(title) {
    return this.getTaskCardContainerByTitle(title)
  }

  getStatusColumn(statusName) {
    const header = this.page.getByRole('heading', { name: statusName, level: 6 }).first()
    return header.locator('xpath=parent::*')
  }

  async isTaskVisibleInStatusColumn(statusName, title) {
    const column = this.getStatusColumn(statusName)
    return await column.getByText(title, { exact: true }).isVisible().catch(() => false)
  }

  async dragTaskToStatus(title, destinationStatusName) {
    const source = await this.getTaskCardDraggableByTitle(title)
    const destination = this.getStatusColumn(destinationStatusName)

    const sourceBox = await source.boundingBox()
    const destinationBox = await destination.boundingBox()

    if (!sourceBox || !destinationBox) {
      throw new Error('Не удалось получить координаты для drag&drop')
    }

    const startX = sourceBox.x + sourceBox.width / 2
    const startY = sourceBox.y + Math.min(20, sourceBox.height / 2)

    const endX = destinationBox.x + destinationBox.width / 2
    const endY = destinationBox.y + Math.min(40, destinationBox.height / 2) + 20

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(endX, endY, { steps: 25 })
    await this.page.mouse.up()
  }

  async dragTaskToTask(title, targetTitle) {
    const source = await this.getTaskCardDraggableByTitle(title)
    const target = await this.getTaskCardDraggableByTitle(targetTitle)

    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()

    if (!sourceBox || !targetBox) {
      throw new Error('Не удалось получить координаты для drag&drop')
    }

    const startX = sourceBox.x + sourceBox.width / 2
    const startY = sourceBox.y + Math.min(20, sourceBox.height / 2)

    const endX = targetBox.x + targetBox.width / 2
    const endY = targetBox.y + Math.min(10, targetBox.height / 2)

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(endX, endY, { steps: 25 })
    await this.page.mouse.up()
  }

  async dragTaskToCoordinates(title, x, y) {
    const source = await this.getTaskCardDraggableByTitle(title)
    const sourceBox = await source.boundingBox()

    if (!sourceBox) {
      throw new Error('Не удалось получить координаты для drag&drop')
    }

    const startX = sourceBox.x + sourceBox.width / 2
    const startY = sourceBox.y + Math.min(20, sourceBox.height / 2)

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(x, y, { steps: 25 })
    await this.page.mouse.up()
  }

  async getTaskButtonNamesInColumn(statusName) {
    const column = this.getStatusColumn(statusName)
    return await column.getByRole('button').allTextContents()
  }

  async openCombobox(label) {
    const combo = this.page.getByRole('combobox', { name: new RegExp(String.raw`^${label}\b`, 'i') }).first()
    await combo.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
    await combo.click()
  }

  async selectOptionFromOpenedSelect(optionText) {
    const listbox = this.page.getByRole('listbox').first()
    await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
    await listbox.getByText(optionText, { exact: true }).click()
  }

  async setFilterAssignee(email) {
    await this.openCombobox('Assignee')
    await this.selectOptionFromOpenedSelect(email)
  }

  async setFilterStatus(statusName) {
    await this.openCombobox('Status')
    await this.selectOptionFromOpenedSelect(statusName)
  }

  async setFilterLabel(labelName) {
    await this.openCombobox('Label')
    await this.selectOptionFromOpenedSelect(labelName)
  }

  async setFormAssignee(email) {
    await this.openCombobox('Assignee')
    await this.selectOptionFromOpenedSelect(email)
  }

  async setFormStatus(statusName) {
    await this.openCombobox('Status')
    await this.selectOptionFromOpenedSelect(statusName)
  }

  async setFormLabels(labelNames) {
    await this.openCombobox('Label')
    const listbox = this.page.getByRole('listbox').first()
    await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })

    for (const name of labelNames) {
      await listbox.getByText(name, { exact: true }).click()
    }

    await this.page.keyboard.press('Escape')
  }

  async openTaskEditFromCard(title) {
    const container = this.getTaskCardContainerByTitle(title)
    await container.getByRole('link', { name: 'Edit' }).first().click()
    await this.getTitleInput().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM })
  }

  async openTaskShowFromCard(title) {
    const container = this.getTaskCardContainerByTitle(title)
    await container.getByRole('link', { name: 'Show' }).first().click()
  }

  /**
   * Возвращает функцию для проверки видимости карточки задачи
   * @param {string} title - Название задачи
   * @returns {Function} Функция для использования с expect.poll
   */
  getTaskCardVisibilityChecker(title) {
    return () => this.getTaskCardContainerByTitle(title).isVisible().catch(() => false)
  }

  /**
   * Возвращает функцию для проверки видимости задачи в колонке статуса
   * @param {string} statusName - Название статуса
   * @param {string} title - Название задачи
   * @returns {Function} Функция для использования с expect.poll
   */
  getTaskInStatusColumnChecker(statusName, title) {
    return () => this.isTaskVisibleInStatusColumn(statusName, title)
  }

  /**
   * Устанавливает несколько фильтров одновременно
   * @param {Object} filters - Объект с фильтрами {assignee, status, label}
   */
  async setFilters(filters) {
    if (filters.assignee) {
      await this.setFilterAssignee(filters.assignee)
    }
    if (filters.status) {
      await this.setFilterStatus(filters.status)
    }
    if (filters.label) {
      await this.setFilterLabel(filters.label)
    }
  }

  /**
   * Создает задачу с полными данными
   * @param {Object} taskData - Данные задачи {title, content}
   * @param {Object} options - Опции {assignee, status, labels}
   */
  async createTaskWithOptions(taskData, options = {}) {
    await this.openCreateForm()
    if (options.assignee) {
      await this.setFormAssignee(options.assignee)
    }
    if (options.status) {
      await this.setFormStatus(options.status)
    }
    if (options.labels) {
      await this.setFormLabels(options.labels)
    }
    await this.fillTaskForm(taskData)
    await this.saveTask()
    await this.goto()
  }

  /**
   * Возвращает локаторы для колонок статусов
   * @param {Array<string>} statuses - Массив статусов
   * @returns {Array} Массив локаторов
   */
  getStatusColumnLocators(statuses) {
    return statuses.map(status => this.page.getByText(status, { exact: true }))
  }

  /**
   * Возвращает локатор фильтра статуса
   * @param {string} statusName - Название статуса
   * @returns {Object} Локатор combobox фильтра статуса
   */
  getFilterStatusLocator(statusName) {
    return this.page.getByRole('combobox', { name: new RegExp(String.raw`Status.*${statusName}`, 'i') })
  }

  /**
   * Получает текст на странице Show задачи
   * @param {string} text - Текст для поиска
   * @returns {Object} Локатор текста
   */
  getTaskShowText(text) {
    return this.page.getByText(text, { exact: true })
  }

  /**
   * Получает ссылку на странице Show задачи
   * @param {string} linkText - Текст ссылки
   * @returns {Object} Локатор ссылки
   */
  getTaskShowLink(linkText) {
    return this.page.getByRole('link', { name: linkText })
  }

  /**
   * Проверяет, что URL содержит путь к задаче
   * @param {string|number} taskId - ID задачи
   * @returns {Promise<boolean>} Результат проверки
   */
  async isTaskShowPage(taskId) {
    const url = this.page.url()
    return url.includes(`/#/tasks/${taskId}`)
  }

  /**
   * Проверяет, что URL содержит путь к созданию задачи
   * @returns {Promise<boolean>} Результат проверки
   */
  async isTaskCreatePage() {
    const url = this.page.url()
    return url.includes('/#/tasks/create')
  }
}
