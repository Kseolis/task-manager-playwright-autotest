# Task Manager Playwright Autotests

Проект содержит автотесты UI на **Playwright** для учебного Task Manager.

### Быстрый старт

- **Установка зависимостей**:

```bash
make install
```

- **Запуск приложения локально (dev)**:

```bash
make run
```

- **Запуск линтера**:

```bash
make lint
```

### Запуск автотестов

Playwright-конфигурация поднимает dev-сервер автоматически через `webServer` (см. `playwright.config.js`), поэтому отдельно стартовать `npm run dev` обычно не нужно.

- **Запуск тестов через Makefile**:

```bash
make test
```

- **Запуск тестов через npm**:

```bash
npm test
```

- **Дебаг режим**:

```bash
npm run test:debug
```

- **UI режим**:

```bash
npm run test:ui
```

- **Открыть HTML-репорт**:

```bash
npm run test:report
```

### Переменные окружения

- **BASE_URL**: базовый URL приложения (по умолчанию `http://localhost:5173`)
- **EXPECT_TIMEOUT**: таймаут ожиданий `expect()` в мс (по умолчанию `5000`)
- **CI**: при наличии включает `forbidOnly`, `retries=2`, `workers=1` и отключает автопоказ HTML-репорта
