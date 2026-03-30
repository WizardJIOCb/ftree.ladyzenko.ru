# Geodom — SDD для Codex

## 1. Идея проекта

**Geodom** — web‑приложение для создания, просмотра, редактирования и публикации генеалогических деревьев с поддержкой **GEDCOM**.

Домен: **geodom.ladyzenko.ru**

Ключевая цель: сделать не просто «ещё один список родственников», а удобный **визуальный редактор дерева**, где пользователь может:
- легко строить семейное дерево вручную;
- импортировать и экспортировать данные в GEDCOM;
- быстро добавлять людей, браки, родительские связи, события жизни;
- свободно двигать узлы мышью/тачем;
- зумить и панорамировать очень большие деревья;
- смотреть дерево в лёгком, воздушном и читаемом визуальном стиле;
- публиковать дерево в каталоге или держать его приватным;
- делиться деревом с родственниками и совместно редактировать его.

---

## 2. Продуктовые принципы

1. **Визуал прежде всего**  
   Главная сущность продукта — не таблица, а дерево как интерактивная карта семьи.

2. **Ручное управление + авто‑раскладка**  
   Пользователь может сам двигать узлы и группы узлов, но также может нажать «Авторазместить дерево».

3. **Большие деревья должны работать быстро**  
   Виртуализация, lazy rendering, уровни детализации по zoom.

4. **GEDCOM first**  
   Импорт/экспорт — не второстепенная фича, а один из столпов продукта.

5. **Понятность для обычных людей**  
   Интерфейс должен быть дружелюбным даже для пользователя, который никогда не работал с генеалогическим ПО.

6. **Многопользовательскость и история изменений**  
   Нужно сразу закладывать ownership, совместный доступ, версии, аудит.

---

## 3. Пользовательские сценарии

### 3.1. Основные
- Зарегистрироваться по email/password.
- Войти через Google.
- Войти через VK ID / Mail.ru.
- Создать новое дерево с нуля.
- Импортировать дерево из GEDCOM.
- Открыть редактор дерева.
- Добавить человека.
- Связать людей как супругов / родителей / детей.
- Добавить даты и события жизни.
- Перетаскивать узлы руками.
- Запустить авто‑layout.
- Сохранить изменения.
- Экспортировать дерево в GEDCOM.
- Экспортировать дерево как PNG / SVG / PDF.
- Сделать дерево публичным и показать его в каталоге.
- Пригласить другого пользователя в совместное редактирование.

### 3.2. Продвинутые
- Добавлять фото, документы, источники.
- Вести заметки и биографии.
- Смотреть таймлайн семьи.
- Искать людей по дереву.
- Фильтровать ветки: по фамилии, роду, линии, живым/умершим, поколению.
- Скрывать приватные данные живых людей.
- Смотреть карту мест рождения / смерти / браков.
- Смотреть статистику дерева: число персон, поколений, веток, связей.
- Сравнивать версии дерева и откатывать изменения.
- Сливать дубликаты людей.
- Создавать несколько деревьев в одном аккаунте.

---

## 4. Что добавить сверх базового редактора

Ниже список того, что стоит заложить сразу в архитектуру, даже если часть пойдёт во вторую очередь.

### 4.1. Функции, которые реально усилят продукт
1. **Источники и доказательства**  
   Для каждого факта (дата рождения, место, родители, брак, смерть) можно прикрепить источник: архив, ссылка, документ, фото, комментарий.

2. **Версионность дерева**  
   История изменений с diff: кто, когда, что поменял.

3. **Приватность живых людей**  
   Отдельные правила видимости для живых персон.

4. **Совместная работа**  
   Владельцы, редакторы, комментаторы, читатели.

5. **Публичные страницы деревьев**  
   Красивый readonly‑режим для просмотра по ссылке.

6. **Экспорт постеров**  
   Генерация красивых вертикальных/горизонтальных плакатов семьи.

7. **Таймлайн семьи**  
   Единая лента всех событий: рождения, браки, переезды, смерти, службы, профессии.

8. **Дубликаты / merge**  
   Очень важная фича для реальной генеалогии.

9. **Каталог деревьев**  
   Публичный список деревьев пользователей с поиском и карточками.

10. **Профили родов / фамилий**  
   Не только дерево, но и “родовая карточка”: фамилия, география, заметки, документы, фото.

### 4.2. Фишки, которые могут сделать продукт заметным
1. **Story mode / история семьи**  
   Автоматически собирать narrative‑страницу: “История рода Ладыженко”.

2. **Ветка‑фокус**  
   Кнопка “показать только предков выбранного человека” / “только потомков”.

3. **Семейные альбомы**  
   Фото привязаны не только к людям, но и к событиям.

4. **Генеалогические карточки для печати**  
   Печатная анкета персоны / семейной пары / ветки.

5. **Map mode**  
   География рода по карте и таймлайну.

6. **Интеллектуальные подсказки**  
   Например: “у этой персоны нет родителей”, “даты конфликтуют”, “возможный дубль”, “ребёнок родился раньше брака” и т.п.

---

## 5. MVP vs Phase 2

## MVP
- Регистрация / логин / social auth.
- Создание дерева.
- Каталог деревьев.
- Визуальный редактор.
- Добавление персон.
- Добавление базовых связей:
  - parent-child
  - spouse/partner
- Перетаскивание узлов.
- Зум / пан.
- Авто‑layout.
- Сайдпанель редактирования персоны.
- Импорт GEDCOM.
- Экспорт GEDCOM.
- Экспорт PNG / SVG / PDF.
- Публичный/приватный режим дерева.
- Базовые роли доступа.
- Фото профиля персоны.
- История изменений (минимальная).

## Phase 2
- Источники и доказательства.
- Таймлайн.
- Карта.
- Совместное редактирование в real time.
- Merge duplicates.
- Story mode.
- Комментарии по дереву.
- Ветка‑фокус / фильтры / saved views.
- Печать постеров.
- Версии и откат.
- Уведомления.

---

## 6. Технологический стек

## Frontend
- **React + TypeScript + Vite**
- **Tailwind CSS**
- **shadcn/ui**
- **@xyflow/react (React Flow)** — основа canvas/editor для узлов, рёбер, zoom/pan, selection
- **ELK.js** — авто‑layout для дерева
- **Zustand** — локальное состояние редактора
- **TanStack Query** — запросы и кеш
- **React Hook Form + Zod** — формы и валидация
- **Tiptap** — rich text для биографий/заметок
- **dnd-kit** — если понадобится расширенный drag/drop вне graph‑слоя

## Backend
- **Node.js + TypeScript**
- **Fastify** (или Express, если команда хочет максимально привычный стек; по умолчанию Fastify)
- **PostgreSQL**
- **Drizzle ORM**
- **Redis** — сессии, кэш, rate limit, очереди presence
- **BullMQ** — фоновые задачи (экспорт PDF, генерация превью, импорт GEDCOM, поиск дубликатов)
- **S3‑compatible storage** — фото, документы, экспортные файлы

## Auth
- Собственная email/password auth
- OAuth/OIDC провайдеры:
  - Google
  - VK ID
  - Mail.ru

## Search
- PostgreSQL full text search на MVP
- позже Meilisearch / OpenSearch, если потребуется

## Realtime (Phase 2)
- WebSocket / Socket.IO
- позже Yjs + y-websocket для CRDT collaborative editing

## Infra
- Nginx
- PM2 или Docker Compose
- отдельные env для dev/stage/prod
- object storage buckets для media/export/temp

---

## 7. Почему именно такой editor stack

Нельзя делать редактор дерева полностью самописным “с нуля” на обычном div/canvas без graph‑движка.

Нужно взять **React Flow** как фундамент и поверх него построить генеалогический слой:
- свои типы узлов;
- свои типы связей;
- свои interaction rules;
- свою панель редактирования;
- свои режимы layout;
- свою оптимизацию под очень большие деревья.

Причина:
- pan/zoom/viewport уже решены;
- selection и drag уже решены;
- edge routing и events уже решены на базовом уровне;
- легче поддерживать mobile/desktop;
- легче внедрить minimap, controls, fitView, export.

Для авто‑layout использовать **ELK.js**:
- режим layout “предки вверх / потомки вниз”;
- отдельный layout для descendancy view;
- отдельный compact layout для маленьких экранов;
- кнопка “respect manual positions where possible” для гибридного режима.

---

## 8. Визуальная модель дерева

## 8.1. Узлы
Основной узел — **Person Node**.

Отображает:
- аватар / фото;
- имя + фамилию;
- годы жизни;
- пол;
- короткий статус;
- иконки наличия событий/источников/фото/заметок;
- цветовую метку ветки / линии / фамилии.

Дополнительные варианты узлов:
- **Family/Union Node** — технический узел связи пары;
- **Group/Branch Node** — сворачиваемый контейнер ветки (опционально);
- **Placeholder Node** — “добавить родителя / ребёнка / супруга”.

## 8.2. Рёбра
Типы связей:
- parent-child
- spouse/partner
- adopted / foster / guardian
- divorced / separated
- unknown relation / probable relation

Особенности:
- разные стили линий;
- подписи на связи при необходимости;
- real-time redraw при перемещении узлов;
- выделение цепочки родства по hover/select.

## 8.3. Режимы просмотра
1. **Full Tree View** — всё дерево.
2. **Ancestors View** — только предки выбранного человека.
3. **Descendants View** — только потомки.
4. **Kinship Path View** — путь родства между двумя персонами.
5. **Timeline View** — события в хронологии.
6. **Map View** — география событий.

---

## 9. UX редактора

### 9.1. Основные взаимодействия
- drag node — двигает узел
- drag canvas — панорама
- wheel / pinch — zoom
- tap/click node — выбор персоны
- double click node — открыть карточку редактирования
- long tap / context menu — действия
- drag handle from node — быстро создать связь

### 9.2. Быстрые действия на узле
На каждой карточке узла или в floating toolbar:
- Добавить отца
- Добавить мать
- Добавить супруга/партнёра
- Добавить ребёнка
- Добавить брата/сестру
- Добавить событие
- Открыть профиль
- Центрировать на узле
- Показать только ветку

### 9.3. Сайдпанель персоны
Вкладки:
- Основное
- События
- Родственные связи
- Источники
- Фото / документы
- Биография / заметки
- История изменений

### 9.4. Большие деревья
Нужно обязательно поддержать:
- сворачивание веток;
- скрытие далёких поколений;
- уровни детализации по zoom;
- lazy load поддеревьев;
- fit selected branch;
- minimap.

---

## 10. Объектная модель домена

## 10.1. Сущности верхнего уровня
- User
- AuthIdentity
- Tree
- TreeMember
- TreeCollaborator
- Person
- Relationship
- FamilyUnion
- Event
- Place
- Source
- Citation
- MediaAsset
- Note
- ChangeSet
- TreeSnapshot
- ExportJob
- ImportJob
- CatalogEntry

## 10.2. Концепции

### Tree
Отдельное дерево пользователя.

Поля:
- id
- ownerUserId
- title
- slug
- description
- visibility (private / unlisted / public)
- coverImageId
- defaultViewMode
- settingsJson
- createdAt
- updatedAt
- publishedAt

### Person
Персона внутри дерева.

Поля:
- id
- treeId
- externalKey
- givenName
- middleName
- surname
- maidenName
- displayName
- sex
- isLiving
- birthDateRaw
- birthDateSort
- deathDateRaw
- deathDateSort
- birthPlaceId
- deathPlaceId
- biography
- occupation
- religion
- nationality
- photoAssetId
- privacyLevel
- x
- y
- manualPositionLocked
- metaJson
- createdBy
- updatedBy
- createdAt
- updatedAt
- deletedAt

### FamilyUnion
Семейный союз/пара как логическая сущность.

Поля:
- id
- treeId
- partner1PersonId
- partner2PersonId
- unionType (marriage / partnership / unknown)
- startDateRaw
- endDateRaw
- placeId
- status
- notes
- createdAt
- updatedAt

### Relationship
Гибкая связь между персонами.

Поля:
- id
- treeId
- fromPersonId
- toPersonId
- type
- familyUnionId
- certainty
- startDateRaw
- endDateRaw
- notes
- createdAt
- updatedAt

### Event
Факты биографии.

Поля:
- id
- treeId
- personId nullable
- familyUnionId nullable
- type (birth, death, marriage, divorce, burial, occupation, residence, military, education, custom)
- title
- dateRaw
- dateSortStart
- dateSortEnd
- placeId
- description
- privacyLevel
- createdAt
- updatedAt

### Source
Источник информации.

Поля:
- id
- treeId
- title
- type
- author
- publicationInfo
- repository
- url
- description
- createdAt
- updatedAt

### Citation
Привязка источника к факту.

Поля:
- id
- treeId
- sourceId
- entityType
- entityId
- page
- quote
- note
- confidence
- createdAt
- updatedAt

### MediaAsset
Фото/документы.

Поля:
- id
- ownerUserId
- treeId nullable
- storageKey
- mimeType
- sizeBytes
- width
- height
- durationSec
- originalFileName
- altText
- createdAt

### ChangeSet
Группа изменений для аудита/версий.

Поля:
- id
- treeId
- actorUserId
- actionType
- summary
- patchJson
- createdAt

---

## 11. База данных — предлагаемые таблицы

### users
- id
- email
- password_hash nullable
- username
- display_name
- avatar_asset_id nullable
- bio
- is_email_verified
- status
- created_at
- updated_at

### auth_identities
- id
- user_id
- provider (google, vk, mailru, local)
- provider_user_id
- email
- access_token_encrypted nullable
- refresh_token_encrypted nullable
- token_expires_at nullable
- raw_profile_json nullable
- created_at
- updated_at

### trees
- id
- owner_user_id
- title
- slug
- description
- visibility
- cover_asset_id nullable
- default_view_mode
- settings_jsonb
- created_at
- updated_at
- published_at nullable

### tree_collaborators
- id
- tree_id
- user_id
- role (owner, editor, commenter, viewer)
- invited_by nullable
- created_at
- updated_at

### persons
- id
- tree_id
- external_key nullable
- given_name
- middle_name nullable
- surname nullable
- maiden_name nullable
- display_name nullable
- sex nullable
- is_living boolean
- birth_date_raw nullable
- birth_date_sort nullable
- death_date_raw nullable
- death_date_sort nullable
- birth_place_id nullable
- death_place_id nullable
- occupation nullable
- religion nullable
- nationality nullable
- biography nullable
- photo_asset_id nullable
- privacy_level
- x nullable
- y nullable
- manual_position_locked boolean
- meta_jsonb
- created_by nullable
- updated_by nullable
- created_at
- updated_at
- deleted_at nullable

### family_unions
- id
- tree_id
- partner1_person_id nullable
- partner2_person_id nullable
- union_type
- status
- start_date_raw nullable
- end_date_raw nullable
- place_id nullable
- notes nullable
- created_at
- updated_at

### relationships
- id
- tree_id
- from_person_id
- to_person_id
- type
- family_union_id nullable
- certainty
- start_date_raw nullable
- end_date_raw nullable
- notes nullable
- created_at
- updated_at

### places
- id
- tree_id nullable
- title
- normalized_title nullable
- latitude nullable
- longitude nullable
- country nullable
- region nullable
- district nullable
- city nullable
- notes nullable
- created_at
- updated_at

### events
- id
- tree_id
- person_id nullable
- family_union_id nullable
- type
- title nullable
- date_raw nullable
- date_sort_start nullable
- date_sort_end nullable
- place_id nullable
- description nullable
- privacy_level
- created_at
- updated_at

### sources
- id
- tree_id
- title
- type nullable
- author nullable
- publication_info nullable
- repository nullable
- url nullable
- description nullable
- created_at
- updated_at

### citations
- id
- tree_id
- source_id
- entity_type
- entity_id
- page nullable
- quote nullable
- note nullable
- confidence nullable
- created_at
- updated_at

### notes
- id
- tree_id
- entity_type
- entity_id
- body
- rich_body_json nullable
- created_by
- created_at
- updated_at

### media_assets
- id
- owner_user_id
- tree_id nullable
- storage_key
- mime_type
- size_bytes
- width nullable
- height nullable
- duration_sec nullable
- original_file_name
- alt_text nullable
- meta_jsonb nullable
- created_at

### tree_snapshots
- id
- tree_id
- created_by
- title nullable
- snapshot_jsonb
- created_at

### change_sets
- id
- tree_id
- actor_user_id nullable
- action_type
- summary
- patch_jsonb
- created_at

### import_jobs
- id
- user_id
- tree_id nullable
- source_asset_id
- status
- result_jsonb nullable
- error_text nullable
- created_at
- updated_at

### export_jobs
- id
- user_id
- tree_id
- format
- status
- result_asset_id nullable
- options_jsonb nullable
- error_text nullable
- created_at
- updated_at

---

## 12. GEDCOM support

## 12.1. Что поддерживаем
На MVP закладываем:
- импорт GEDCOM 5.5 / 5.5.1 / 7.0 по best-effort;
- экспорт в GEDCOM 7.0;
- экспорт в legacy compatible mode 5.5.1 при необходимости;
- сохранение исходного файла импорта;
- mapping log: какие поля импортировались точно, какие частично, какие не поддержаны.

## 12.2. Что импортируем
- HEAD
- SUBM / SUBN (если есть)
- INDI
- FAM
- NAME
- SEX
- BIRT / DEAT
- MARR / DIV
- DATE / PLAC
- NOTE
- OBJE (насколько возможно)
- SOUR
- CHAN
- custom tags в raw meta

## 12.3. Стратегия импорта
1. Загрузить файл.
2. Сохранить оригинал.
3. Распарсить в intermediate canonical model.
4. Провалидировать.
5. Показать preview и warnings.
6. Дать пользователю выбрать:
   - создать новое дерево;
   - импортировать в существующее;
   - попытаться слить с существующим.
7. Записать данные в БД.
8. Построить initial auto layout.
9. Сохранить import report.

## 12.4. Важные моменты
- Не терять неизвестные/custom теги — складывать их в meta/raw blocks.
- Raw dates хранить как исходную строку + нормализованное sortable поле.
- Сразу предусмотреть, что разные GEDCOM‑файлы грязные и неполные.

## 12.5. Экспорт
Экспорт должен уметь:
- формировать .ged;
- собирать media bundle;
- позже — GEDZIP;
- позволять опции:
  - export living persons masked
  - export private notes off
  - include sources on/off
  - include media refs on/off

---

## 13. Авторизация и аккаунты

## 13.1. Способы входа
- email + password
- Google
- VK ID
- Mail.ru

## 13.2. Account linking
Один пользователь может привязать несколько identity провайдеров к одному аккаунту.

Нужно предусмотреть:
- login by provider;
- attach provider to existing account;
- safe merge by verified email;
- ручное подтверждение конфликта email.

## 13.3. Роли в дереве
- owner
- editor
- commenter
- viewer

## 13.4. Публичность дерева
- private — только владелец и приглашённые
- unlisted — по ссылке
- public — видно в каталоге

---

## 14. Каталог деревьев пользователей

Отдельная публичная часть приложения:
- список публичных деревьев;
- карточки деревьев;
- обложка;
- владелец;
- краткое описание;
- число персон;
- число поколений;
- дата обновления;
- фильтры и поиск.

Страница публичного дерева:
- readonly просмотр;
- public profile дерева;
- кнопка “Открыть дерево”;
- кнопка “Скопировать себе” (если владелец разрешил).

---

## 15. Экспорт кроме GEDCOM

Нужно поддержать:
- PNG
- SVG
- PDF

Параметры экспорта:
- full tree / current viewport / selected branch
- with background / transparent
- poster mode
- A4/A3/A2 preset
- portrait / landscape
- show photos on/off
- show notes on/off
- compact / detailed card mode

---

## 16. Производительность

Это критично. Деревья могут быть очень большими.

Нужно заложить:
- viewport-based rendering;
- memoized custom nodes;
- batch updates;
- debounced autosave;
- async layout jobs;
- collapse subtrees;
- detail by zoom level;
- worker для тяжёлых layout/import/export операций;
- серверные export jobs в очереди.

Цели:
- дерево на 500–1500 персон должно оставаться usable;
- обычные перемещения узлов не должны лагать;
- drag и zoom должны ощущаться плавно.

---

## 17. Правила валидации данных

Нужны проверки:
- циклические родительские связи запрещены;
- нельзя сделать человека своим предком/потомком;
- предупреждать о странных датах;
- предупреждать о слишком раннем/позднем возрасте родителей;
- предупреждать о дублях имён + близких дат;
- логировать импортные аномалии.

---

## 18. REST API (черновой дизайн)

## Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/me
- POST /api/auth/oauth/:provider/start
- GET /api/auth/oauth/:provider/callback
- POST /api/auth/link/:provider
- DELETE /api/auth/link/:provider

## Trees
- GET /api/trees
- POST /api/trees
- GET /api/trees/:id
- PATCH /api/trees/:id
- DELETE /api/trees/:id
- POST /api/trees/:id/publish
- POST /api/trees/:id/unpublish
- GET /api/catalog/trees
- GET /api/catalog/trees/:slug

## Persons
- GET /api/trees/:treeId/persons
- POST /api/trees/:treeId/persons
- GET /api/trees/:treeId/persons/:personId
- PATCH /api/trees/:treeId/persons/:personId
- DELETE /api/trees/:treeId/persons/:personId
- POST /api/trees/:treeId/persons/:personId/photo

## Relationships / unions
- POST /api/trees/:treeId/relationships
- PATCH /api/trees/:treeId/relationships/:id
- DELETE /api/trees/:treeId/relationships/:id
- POST /api/trees/:treeId/unions
- PATCH /api/trees/:treeId/unions/:id
- DELETE /api/trees/:treeId/unions/:id

## Events
- GET /api/trees/:treeId/events
- POST /api/trees/:treeId/events
- PATCH /api/trees/:treeId/events/:id
- DELETE /api/trees/:treeId/events/:id

## Sources / citations
- GET /api/trees/:treeId/sources
- POST /api/trees/:treeId/sources
- PATCH /api/trees/:treeId/sources/:id
- DELETE /api/trees/:treeId/sources/:id
- POST /api/trees/:treeId/citations
- PATCH /api/trees/:treeId/citations/:id
- DELETE /api/trees/:treeId/citations/:id

## Layout
- POST /api/trees/:treeId/layout/auto
- POST /api/trees/:treeId/layout/save-positions
- POST /api/trees/:treeId/layout/reset

## Import / export
- POST /api/import/gedcom
- GET /api/import/jobs/:id
- POST /api/trees/:treeId/export/gedcom
- POST /api/trees/:treeId/export/png
- POST /api/trees/:treeId/export/svg
- POST /api/trees/:treeId/export/pdf
- GET /api/export/jobs/:id

## Collaboration
- GET /api/trees/:treeId/collaborators
- POST /api/trees/:treeId/collaborators
- PATCH /api/trees/:treeId/collaborators/:id
- DELETE /api/trees/:treeId/collaborators/:id

---

## 19. Realtime / collaborative editing (Phase 2)

На MVP можно обойтись optimistic save + polling/WebSocket presence.

Но архитектурно нужно оставить путь к real-time:
- кто сейчас смотрит дерево;
- кто редактирует конкретную персону;
- мягкие блокировки/indicators;
- позже CRDT‑модель на Yjs.

Рекомендуемый путь:
1. MVP — обычный backend persistence + audit.
2. Phase 2 — presence через WebSocket.
3. Phase 3 — Yjs collaborative state для дерева и заметок.

---

## 20. Безопасность

- bcrypt/argon2 для password hash
- CSRF protection где нужно
- secure cookies
- rate limiting auth endpoints
- email verification
- password reset
- encrypted token storage for linked providers
- access control на уровне дерева и сущностей
- privacy masking for living persons in public trees
- audit log of critical actions

---

## 21. SEO и публичные страницы

Публичные деревья и карточки персон должны иметь:
- SSR/предрендер мета;
- OpenGraph;
- красивый preview;
- canonical links;
- robots policy для private/unlisted.

Если frontend остаётся на Vite SPA, тогда для public pages либо:
- делать отдельный SSR shell сервис;
- либо перейти на Next.js.

### Рекомендация
Для MVP можно оставить **React + Vite SPA**, если SEO не критично в первый спринт.  
Но если каталог деревьев и публичные страницы важны с первого дня, серьёзно рассмотреть **Next.js** вместо Vite.

---

## 22. UI/UX стиль

Нужно избегать ощущения тяжёлой “архивной программы”.

Визуальный стиль:
- светлый воздушный интерфейс;
- тонкие линии связей;
- аккуратные карточки людей;
- много воздуха;
- мягкие тени;
- хорошие состояния hover/select/focus;
- минималистичная панель инструментов;
- удобство и на desktop, и на tablet.

Темы:
- light (основная)
- soft sepia / parchment theme
- dark mode (опционально)

---

## 23. Состояния редактора

Нужно разделить:
- persisted state (backend)
- local UI/editor state
- transient interaction state

Пример:
- persisted: persons, relationships, unions, events, saved positions
- local UI: selected node, panel tabs, filters, viewport
- transient: dragging, box selection, creating relation preview

---

## 24. Алгоритмы layout

Нужно минимум 3 layout режима:

### 24.1. Genealogy Vertical
- предки сверху
- выбранная персона в центре
- потомки снизу
- spouse nodes горизонтально рядом

### 24.2. Descendants Wide
- корневая персона слева
- поколения вправо
- удобно для больших веток потомков

### 24.3. Compact Poster
- режим под печать и экспорт
- минимизация пустот
- компактные карточки

Гибридный режим:
- авто layout раскладывает дерево;
- ручные позиции пользователя сохраняются;
- повторный auto layout либо respect locked nodes, либо reset completely.

---

## 25. Структура фронтенда

Предлагаемая структура:

```text
src/
  app/
  pages/
    auth/
    dashboard/
    trees/
    catalog/
  components/
    ui/
    layout/
    tree/
      canvas/
      nodes/
      edges/
      panels/
      toolbars/
      minimap/
      filters/
      views/
  features/
    auth/
    trees/
    persons/
    relationships/
    events/
    sources/
    media/
    import-export/
    catalog/
  stores/
  hooks/
  lib/
    api/
    auth/
    gedcom/
    layout/
    utils/
  types/
```

---

## 26. Структура backend

```text
server/
  src/
    app.ts
    plugins/
    modules/
      auth/
      users/
      trees/
      persons/
      relationships/
      unions/
      events/
      places/
      sources/
      citations/
      media/
      imports/
      exports/
      catalog/
      collaboration/
      audit/
    db/
      schema/
      migrations/
      seeds/
    services/
      gedcom/
      layout/
      storage/
      export/
      search/
```

---

## 27. Очередь реализации для Codex

### Этап 1. Базовый каркас проекта
- поднять frontend и backend
- настроить БД и Drizzle
- auth local
- user profile
- базовый dashboard

### Этап 2. Деревья и каталог
- CRUD деревьев
- права доступа
- публичность
- каталог публичных деревьев

### Этап 3. Визуальный editor
- React Flow integration
- Person Node
- базовые edges
- pan/zoom/select/drag
- side panel
- autosave

### Этап 4. Родственные связи
- parent-child
- spouse/partner
- family unions
- quick add actions
- validation rules

### Этап 5. Layout engine
- ELK integration
- 2–3 layout режима
- save manual positions
- locked nodes

### Этап 6. GEDCOM
- parser layer
- canonical import model
- import preview
- import job
- export GEDCOM
- import/export reports

### Этап 7. Export graphics
- PNG
- SVG
- PDF
- poster presets

### Этап 8. Auth providers
- Google
- VK ID
- Mail.ru
- account linking

### Этап 9. Media / sources / notes
- file uploads
- sources
- citations
- notes / biography

### Этап 10. Audit / versioning / polish
- change sets
- snapshots
- duplicate hints
- performance tuning
- mobile UX pass

---

## 28. Definition of Done для MVP

MVP считается готовым, если:
- пользователь может зарегистрироваться и войти;
- может создать дерево;
- может открыть интерактивный редактор;
- может добавить людей и связи;
- может двигать узлы и масштабировать дерево;
- может запускать auto layout;
- может импортировать GEDCOM;
- может экспортировать GEDCOM;
- может экспортировать дерево как PNG/SVG/PDF;
- может сделать дерево публичным;
- может открыть каталог публичных деревьев;
- приложение стабильно работает на реальном дереве минимум 300+ персон.

---

## 29. Риски

1. **Сложность layout для больших деревьев**  
   Нужно не переоценить “идеальный auto layout”. Лучше сразу делать несколько режимов и гибрид с ручным управлением.

2. **Грязные GEDCOM файлы**  
   Импорт должен быть tolerant и с отчётом об ошибках.

3. **Большие деревья и производительность**  
   Без оптимизации будет тормозить уже на сотнях узлов.

4. **Совместное редактирование**  
   Не надо тащить CRDT в MVP. Это отдельный этап.

5. **Публичность живых персон**  
   Приватность критична.

---

## 30. Рекомендация по запуску

### Самый правильный путь
Сначала сделать **крепкий MVP**:
- auth
- деревья
- редактор
- GEDCOM import/export
- публичный каталог
- экспорт графики

И только потом:
- real-time collaboration
- sources/citations full power
- story mode
- map/timeline
- advanced merge duplicates

Иначе проект размоется и Codex начнёт распыляться.

---

## 31. Что Codex должен сделать в этой итерации

1. Создать монорепу или два приложения (frontend/backend).
2. Настроить PostgreSQL + Drizzle.
3. Реализовать local auth.
4. Реализовать CRUD для trees/persons/relationships/unions/events.
5. Поднять редактор дерева на React Flow.
6. Сделать кастомный Person Node и базовые edges.
7. Реализовать drag/zoom/pan/select.
8. Реализовать autosave manual positions.
9. Подключить ELK.js для auto layout.
10. Реализовать GEDCOM parser/import pipeline.
11. Реализовать GEDCOM export.
12. Реализовать PNG/SVG/PDF export.
13. Реализовать каталог публичных деревьев.
14. Добавить Google/VK/Mail auth adapters.
15. Сделать базовую историю изменений.

---

## 32. Итог

Geodom должен быть не просто базой родословной, а **визуальной genealogical platform**:
- удобный редактор,
- большая совместимая модель данных,
- GEDCOM как first-class citizen,
- красивый публичный просмотр,
- экспорт в форматы для жизни,
- дальнейшая база для совместной генеалогии, карт, таймлайнов и семейных архивов.

Это уже звучит как нормальный продукт, а не как маленькая форма с родственниками.

