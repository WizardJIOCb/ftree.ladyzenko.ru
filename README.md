# FTree Prototype

Репозиторий содержит первый живой прототип `ftree.ladyzenko.ru`: фронтенд визуального редактора семейного дерева, backend API на Fastify и PostgreSQL в Docker.

## Что внутри

- `geodom-app/` — frontend на `React + TypeScript + Vite + React Flow`
- `server/` — backend на `Fastify + Drizzle ORM + PostgreSQL`
- `docker-compose.yml` — `postgres`, `api`, `web`
- `start-dev.bat` — локальный запуск на Windows
- `stop-dev.bat` — остановка локальных docker-сервисов
- `deploy.sh` — обновление и запуск проекта на Linux-сервере из git

## Локальный запуск на Windows

### Требования

- `Node.js 22+`
- `Docker Desktop`

### Старт

```bat
start-dev.bat
```

Скрипт:

- создаёт `.env`, если его ещё нет
- создаёт `server/.env`, если его ещё нет
- поднимает PostgreSQL в Docker
- устанавливает зависимости frontend и backend
- открывает отдельные окна для Fastify API и Vite dev server

После запуска:

- frontend: `http://localhost:5173`
- api: `http://localhost:3000`
- postgres: `localhost:5432`

Остановить docker-сервисы:

```bat
stop-dev.bat
```

## Переменные окружения

### Корневой `.env`

```env
POSTGRES_DB=ftree_ladyzenko
POSTGRES_USER=ftree_user
POSTGRES_PASSWORD=ftree_local_password
POSTGRES_PORT=5432
API_PORT=3000
APP_PORT=4173
```

### `server/.env`

```env
PORT=3000
DATABASE_URL=postgres://ftree_user:ftree_local_password@localhost:5432/ftree_ladyzenko
```

## Docker сервисы

### `postgres`

- образ: `postgres:16-alpine`
- volume: `ftree_postgres_data`
- healthcheck: `pg_isready`

### `api`

- backend API на Fastify
- подключается к PostgreSQL через `DATABASE_URL`
- автоматически создаёт таблицу `trees`
- сидит демо-деревья, если база пустая

### `web`

- собирает frontend из `geodom-app/`
- отдаёт статику через `nginx`
- проксирует `/api/*` во внутренний контейнер `api`

## Полезные команды

### Локальная сборка frontend

```bash
cd geodom-app
npm install
npm run build
```

### Локальная сборка backend

```bash
cd server
npm install
npm run build
```

### Поднять весь стек в Docker

```bash
docker compose up -d --build postgres api web
```

### Проверить API

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/trees
```

## Production deploy на сервер

```bash
cd /var/www/ftree.ladyzenko.ru
chmod +x deploy.sh
./deploy.sh /var/www/ftree.ladyzenko.ru main
```

Скрипт:

- обновляет ветку `main`
- создаёт `.env`, если его ещё нет
- удаляет контейнеры текущего проекта перед пересборкой
- поднимает `postgres`, `api`, `web`

## HTTPS

Для домена можно выпустить сертификат через `certbot --nginx`. После настройки nginx на сервере проект должен быть доступен по:

- `http://ftree.ladyzenko.ru`
- `https://ftree.ladyzenko.ru`
