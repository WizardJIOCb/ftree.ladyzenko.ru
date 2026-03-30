# Geodom Prototype

Текущий репозиторий содержит первый прототип `ftree.ladyzenko.ru`: мягкий пастельный интерфейс визуального редактора семейного дерева на React Flow и инфраструктурную обвязку для локальной разработки и базового деплоя.

## Что внутри

- `geodom-app/` — фронтенд на `React + TypeScript + Vite`
- `docker-compose.yml` — PostgreSQL в Docker и production-контейнер для фронтенда
- `start-dev.bat` — запуск локальной разработки на Windows
- `stop-dev.bat` — остановка docker-сервисов
- `deploy.sh` — обновление и запуск проекта на Linux-сервере из git
- `.env.example` — переменные окружения для базы и web-контейнера

## Локальный запуск на Windows

### 1. Требования

- `Node.js 22+`
- `Docker Desktop`

### 2. Старт

Запустите:

```bat
start-dev.bat
```

Скрипт:

- создаст `.env` из `.env.example`, если файла ещё нет
- поднимет PostgreSQL в Docker
- установит зависимости фронтенда
- откроет отдельное окно с Vite dev server

После запуска:

- frontend: `http://localhost:5173`
- postgres: `localhost:5432`
- database: `ftree_ladyzenko`
- user: `ftree_user`

Остановить контейнеры:

```bat
stop-dev.bat
```

## Переменные окружения

Базовые значения лежат в `.env.example`:

```env
POSTGRES_DB=ftree_ladyzenko
POSTGRES_USER=ftree_user
POSTGRES_PASSWORD=ftree_local_password
POSTGRES_PORT=5432
APP_PORT=4173
```

Для локальной или серверной установки скопируйте файл в `.env` и поменяйте пароль базы.

## Docker сервисы

### `postgres`

- образ: `postgres:16-alpine`
- volume: `ftree_postgres_data`
- healthcheck: `pg_isready`

### `web`

- собирает фронтенд из `geodom-app/`
- отдаёт статику через `nginx`
- публикуется на порт `${APP_PORT}`

## Production deploy на сервер

На сервере можно выполнить:

```bash
cd /var/www/ftree.ladyzenko.ru
chmod +x deploy.sh
./deploy.sh /var/www/ftree.ladyzenko.ru main
```

Скрипт:

- клонирует репозиторий, если директория ещё пустая
- обновит ветку `main`
- создаст `.env` из `.env.example`, если нужно
- поднимет `postgres` и `web` через Docker Compose

После деплоя frontend будет доступен на порту `${APP_PORT}` сервера, по умолчанию `4173`.

## Полезные команды

Локальная сборка фронтенда:

```bash
cd geodom-app
npm install
npm run build
```

Поднять production-контейнеры локально:

```bash
docker compose up -d --build
```

Остановить production-контейнеры:

```bash
docker compose down
```
