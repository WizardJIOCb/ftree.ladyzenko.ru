#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/var/www/ftree.ladyzenko.ru}"
BRANCH="${2:-main}"

mkdir -p "$PROJECT_DIR"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  git clone --branch "$BRANCH" https://github.com/WizardJIOCb/ftree.ladyzenko.ru "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose up -d --build postgres web
