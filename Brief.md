# ТЕХНИЧЕСКОЕ ЗАДАНИЕ (ТЗ) v4.1
**Проект:** StockMetadata Pro (Desktop Application)  
**Тип:** Desktop-приложение для автоматической атрибутации (Title, Description, Keywords) стоковых изображений.  
**Дата:** Декабрь 2025  
**Обновлено:** 23 декабря 2025 — актуализация стека по результатам MCP Ref исследования  

---

## 1. ЦЕЛЬ ПРОЕКТА

Разработать кроссплатформенное приложение (Windows/macOS), которое:
1. Принимает изображения (**JPG, JPEG, PNG**) с гибкой архитектурой для добавления новых форматов (EPS, TIFF, WebP).
2. Анализирует их через **OpenRouter API** (модель семейства Gemini Flash).
3. Генерирует метаданные (Заголовок, Описание, Ключевые слова) по строгим правилам стоков.
4. Позволяет редактировать данные и менять порядок ключевых слов (Drag & Drop).
5. Записывает метаданные обратно в файл (IPTC/XMP) через ExifTool.

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК

| Категория | Технология | Версия/Примечание |
|-----------|------------|-------------------|
| **Build Tool** | `electron-vite` | v2.3+ — специализированный инструмент для Electron |
| **Core** | Electron | v28+ (последняя стабильная) |
| **Frontend** | React + TypeScript | React 18.3+, TypeScript 5.5+ |
| **UI Framework** | TailwindCSS + shadcn/ui | **TailwindCSS v4** (`@import "tailwindcss"`, `@tailwindcss/vite` плагин) |
| **State Management** | Zustand | v5+ (лучший выбор для Electron: минималистичный, без бойлерплейта) |
| **Backend Logic** | Node.js (Main Process) | **v20.19+ или v22.12+** (требование electron-vite 2.0) |
| **Vite** | Vite | **v5.0+** (требование electron-vite 2.0) |
| **Image Processing** | `sharp` | v0.33+ |
| **Metadata Engine** | `exiftool-vendored` | v28+ |
| **AI Integration** | `openai` (npm) | v4.67+ (настроена на OpenRouter) |
| **Settings Storage** | `electron-store` | v10+ |
| **API Key Encryption** | `safeStorage` (Electron) | OS-native шифрование (Keychain/DPAPI) |
| **Drag & Drop** | `@dnd-kit/sortable` | v8+ (для Keywords сортировки) |

> [!NOTE]
> **Почему `electron-vite`?** Это специализированный build tool для Electron, который решает проблемы конфигурации Vite + Electron: автоматически бандлит main process и preload scripts, предоставляет HMR для renderer, следует best practices безопасности (context isolation).

> [!TIP]
> Используем библиотеку `openai`, т.к. OpenRouter использует тот же формат запросов — это упрощает разработку.

---

## 3. АРХИТЕКТУРА И БЕЗОПАСНОСТЬ

### 3.1 Принципы
| Принцип | Реализация |
|---------|------------|
| **Local First** | Файлы обрабатываются локально. На сервер отправляется только сжатое превью |
| **API Provider** | OpenRouter.ai |
| **API Keys** | Ключ НЕ зашивается в код. Пользователь вводит свой ключ в настройках |
| **File Safety** | Обязательный бекап оригиналов перед записью (если не отключено) |

### 3.2 Поддерживаемые форматы файлов

| Формат | Статус | Метаданные | Примечание |
|--------|--------|------------|------------|
| `.jpg`, `.jpeg` | ✅ MVP | IPTC + XMP | Основной формат стоков |
| `.png` | ✅ MVP | XMP (PNG tEXt) | Поддерживается ExifTool |
| `.tiff` | 🔮 v2.0 | IPTC + XMP | Для расширенной поддержки |
| `.eps` | 🔮 v2.0 | XMP sidecar | Вектор — требуется XMP sidecar файл |
| `.webp` | 🔮 v2.0 | XMP | Современный формат |

### 3.3 Ограничения файлов
| Параметр | Значение |
|----------|----------|
| Максимальный размер файла | 50 MB |
| Поддерживаемые форматы (MVP) | `.jpg`, `.jpeg`, `.png` |
| Минимальное разрешение | 500×500 px |
| Максимальное разрешение для превью | 1024×1024 px (сжатие для отправки в AI) |

### 3.4 Структура проекта (electron-vite)
```
stockmetadata-pro/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # Entry point
│   │   ├── ipc/                 # IPC handlers
│   │   ├── services/
│   │   │   ├── exiftool.service.ts
│   │   │   ├── openrouter.service.ts
│   │   │   └── file-processor/  # 👈 Гибкая архитектура для форматов
│   │   │       ├── index.ts
│   │   │       ├── base.processor.ts
│   │   │       ├── jpeg.processor.ts
│   │   │       ├── png.processor.ts
│   │   │       └── types.ts
│   │   └── utils/
│   ├── preload/                 # Preload scripts (context bridge)
│   │   └── index.ts
│   ├── renderer/                # React Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── stores/          # Zustand stores
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── index.html
│   └── shared/                  # Общие типы и константы
│       ├── types.ts
│       └── constants.ts
├── resources/                   # Иконки, ассеты
├── electron.vite.config.ts      # 👈 electron-vite конфиг
├── electron-builder.yml
└── dist/                        # Билды
```

### 3.5 Архитектура File Processor (Strategy Pattern)

> [!IMPORTANT]
> Для гибкого добавления новых форматов используется паттерн Strategy. Каждый формат имеет свой процессор.

```typescript
// src/main/services/file-processor/types.ts
export interface FileProcessor {
  readonly supportedExtensions: string[];
  readonly mimeTypes: string[];
  
  canProcess(filePath: string): boolean;
  extractPreview(filePath: string): Promise<Buffer>;
  readMetadata(filePath: string): Promise<Metadata>;
  writeMetadata(filePath: string, metadata: Metadata): Promise<void>;
}

export interface Metadata {
  title: string;
  description: string;
  keywords: string[];
}
```

```typescript
// src/main/services/file-processor/jpeg.processor.ts
export class JpegProcessor implements FileProcessor {
  readonly supportedExtensions = ['.jpg', '.jpeg'];
  readonly mimeTypes = ['image/jpeg'];

  canProcess(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  async writeMetadata(filePath: string, metadata: Metadata): Promise<void> {
    await exiftool.write(filePath, {
      'IPTC:ObjectName': metadata.title,
      'IPTC:Caption-Abstract': metadata.description,
      'IPTC:Keywords': metadata.keywords,
      'XMP:Title': metadata.title,
      'XMP:Description': metadata.description,
      'XMP:Subject': metadata.keywords,
    });
  }
}
```

```typescript
// src/main/services/file-processor/png.processor.ts
export class PngProcessor implements FileProcessor {
  readonly supportedExtensions = ['.png'];
  readonly mimeTypes = ['image/png'];

  async writeMetadata(filePath: string, metadata: Metadata): Promise<void> {
    // PNG не поддерживает IPTC, только XMP
    await exiftool.write(filePath, {
      'XMP:Title': metadata.title,
      'XMP:Description': metadata.description,
      'XMP:Subject': metadata.keywords,
    });
  }
}
```

```typescript
// src/main/services/file-processor/index.ts
const processors: FileProcessor[] = [
  new JpegProcessor(),
  new PngProcessor(),
  // 👈 Легко добавить новые форматы:
  // new TiffProcessor(),
  // new EpsProcessor(),
];

export function getProcessor(filePath: string): FileProcessor | null {
  return processors.find(p => p.canProcess(filePath)) || null;
}

export function getSupportedExtensions(): string[] {
  return processors.flatMap(p => p.supportedExtensions);
}
```

---

## 4. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС (UI/UX)

### 4.1 Главное окно (Dashboard)

**Компоновка:** Split View (Две колонки), соотношение 30/70.

```
┌──────────────────────────────────────────────────────────────────┐
│  [≡] StockMetadata Pro                            [⚙] [─] [□] [×]│
├────────────────────┬─────────────────────────────────────────────┤
│                    │                                             │
│  ┌──────────────┐  │   ┌─────────────────────────────────────┐   │
│  │ 📁 Drop files│  │   │                                     │   │
│  │     here     │  │   │        [PREVIEW IMAGE]              │   │
│  └──────────────┘  │   │                                     │   │
│                    │   └─────────────────────────────────────┘   │
│  ┌──────────────┐  │                                             │
│  │ 🖼 img1.jpg  │  │   Title: [________________________________]  │
│  │ ✅ Ready     │  │                                             │
│  ├──────────────┤  │   Description:                              │
│  │ 🖼 img2.jpg  │  │   [____________________________________]    │
│  │ ⏳ Processing│  │   [____________________________________]    │
│  ├──────────────┤  │                                             │
│  │ 🖼 img3.jpg  │  │   Keywords: (Drag to reorder)               │
│  │ ❌ Error     │  │   ┌─────┐ ┌───────┐ ┌──────┐ ┌────────┐     │
│  └──────────────┘  │   │woman│ │laptop │ │office│ │business│ ... │
│                    │   └──×──┘ └───×───┘ └──×───┘ └────×───┘     │
│  [Clear All]       │                                             │
│                    │   Score: [████████░░] 78/100                │
│                    │                                             │
│                    │   [🔄 Regenerate] [📋 Copy All] [💾 Save]   │
└────────────────────┴─────────────────────────────────────────────┘
```

#### Левая колонка (Список файлов)
| Элемент | Описание |
|---------|----------|
| Drop Zone | Область для Drag & Drop файлов. Подсветка при наведении |
| Список файлов | Миниатюра (60×60px) + имя файла + статус |
| Статусы | 🔵 В очереди / 🟡 Обработка / 🟢 Готово / 🔴 Ошибка |
| Выбор файла | Клик выделяет файл и показывает его в правой колонке |
| Контекстное меню | ПКМ: "Удалить из списка", "Переобработать" |

#### Правая колонка (Редактор атрибутов)
| Элемент | Описание |
|---------|----------|
| **Превью** | Изображение, масштабированное под контейнер (max-height: 300px) |
| **Title** | Input, максимум 200 символов. Счётчик символов справа |
| **Description** | Textarea, 2-3 строки. Счётчик символов |
| **Keywords** | Drag & Drop список "тегов-чипов". Каждый тег имеет кнопку удаления (×) |
| **Добавить тег** | Input + Enter для добавления нового тега вручную |
| **Score** | Прогресс-бар + числовое значение (0-100) |
| **Кнопки** | "Regenerate", "Copy All", "Save Metadata" |

### 4.2 Настройки (Settings Modal)

```
┌─────────────────────────────────────────────────┐
│  ⚙️ Settings                               [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔑 API Configuration                           │
│  ─────────────────────────────────────────────  │
│  OpenRouter API Key:                            │
│  [sk-or-v1-•••••••••••••••••••••••••] [👁 Show] │
│                                                 │
│  AI Model:                                      │
│  [google/gemini-2.0-flash-001▼]                 │
│                                                 │
│  📝 System Prompt                               │
│  ─────────────────────────────────────────────  │
│  [____________________________________________] │
│  [____________________________________________] │
│  [____________________________________________] │
│  [Reset to Default]                             │
│                                                 │
│  💾 Backup                                      │
│  ─────────────────────────────────────────────  │
│  [✓] Создавать резервную копию оригинала       │
│  Папка: [./backups/_______________] [Browse]   │
│                                                 │
│  🌐 Language                                    │
│  ─────────────────────────────────────────────  │
│  Metadata Language: [English            ▼]      │
│                                                 │
│              [Cancel]     [Save Settings]       │
└─────────────────────────────────────────────────┘
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| API Key | password input | Ключ OpenRouter. Хранится зашифрованно через **Electron safeStorage** (OS-native) |
| Model | dropdown/editable | По умолчанию: `google/gemini-2.0-flash-001`. Редактируемое поле |
| System Prompt | textarea | Настраиваемый промпт. Есть кнопка сброса к дефолту |
| Backup | checkbox | Включить/выключить бекап. Путь к папке бекапов |
| Language | dropdown | Язык генерации метаданных: English, Russian, Spanish, French, German |

### 4.3 Горячие клавиши

| Комбинация | Действие |
|------------|----------|
| `Ctrl/Cmd + O` | Открыть файлы |
| `Ctrl/Cmd + V` | Вставить изображения из буфера |
| `Ctrl/Cmd + S` | Сохранить метаданные текущего файла |
| `Ctrl/Cmd + Shift + S` | Сохранить метаданные всех файлов |
| `Ctrl/Cmd + R` | Регенерировать метаданные |
| `Ctrl/Cmd + C` | Копировать все метаданные в буфер |
| `Delete` | Удалить выбранный тег |
| `Ctrl/Cmd + ,` | Открыть настройки |
| `Escape` | Закрыть модальные окна |

---

## 5. ЛОГИКА РАБОТЫ (ALGORITHMS)

### 5.1 Конфигурация OpenRouter

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: userSettings.apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://stockmetadata.pro",
    "X-Title": "StockMetadata Pro"
  },
});
```

### 5.2 Параметры запроса

| Параметр | Значение |
|----------|----------|
| Model | `google/gemini-2.0-flash-001` (настраиваемо) |
| Response Format | `{ type: "json_object" }` |
| Max Tokens | 2048 |
| Temperature | 0.3 (для стабильности) |

### 5.3 System Prompt (Default)

```markdown
You are an expert stock photography metadata specialist. Your task is to analyze images and generate SEO-optimized metadata for microstock platforms (Shutterstock, Adobe Stock, iStock).

## OUTPUT FORMAT
Return a valid JSON object with this exact structure:
{
  "title": "string",
  "description": "string", 
  "keywords": ["array", "of", "strings"]
}

## TITLE REQUIREMENTS
- Length: 50-200 characters
- Format: [Main Subject] + [Action/State] + [Context/Setting]
- Start with the main subject (noun)
- Use present tense for actions
- NO articles at the beginning (a, an, the)
- NO punctuation at the end
- NO brand names or trademarked terms

GOOD EXAMPLES:
- "Young woman working on laptop in modern coworking space"
- "Golden retriever running through autumn leaves in park"
- "Fresh vegetables and fruits arranged on wooden kitchen table"

BAD EXAMPLES:
- "A beautiful woman" (article + subjective)
- "Nice photo of a dog" (meta-reference)
- "iPhone on table" (brand name)

## DESCRIPTION REQUIREMENTS
- Length: 100-200 characters
- One or two complete sentences
- Expand on the title with additional context
- Include 2-3 important keywords naturally
- Describe mood, atmosphere, or use case when relevant

## KEYWORD REQUIREMENTS
- Count: exactly 45-50 keywords
- Format: single words or 2-word phrases, lowercase
- Sorting: by visual relevance (most prominent objects first)
- NO duplicates or near-duplicates
- NO plural forms if singular exists
- NO brand names
- Include: main objects, colors, emotions, concepts, use cases

KEYWORD CATEGORIES TO COVER:
1. Main subjects (30%): What is in the image
2. Actions/States (15%): What is happening
3. Setting/Context (15%): Where it takes place
4. Mood/Emotion (10%): How it feels
5. Colors/Style (10%): Visual attributes
6. Use Cases (10%): Who would use this
7. Abstract Concepts (10%): Related ideas

## LANGUAGE
Generate all content in: {{LANGUAGE}}

## BLACKLIST - NEVER USE THESE WORDS:
beautiful, gorgeous, stunning, amazing, awesome, perfect, best, nice, good, great,
4k, 8k, hd, high quality, professional, stock photo, royalty free, 
wallpaper, background image, copy space, negative space,
iPhone, Samsung, Apple, Nike, Adidas, Google, Microsoft, Adobe, 
Canon, Nikon, Sony, Mercedes, BMW, Tesla, Coca-Cola, Pepsi,
© copyright, watermark, logo
```

### 5.4 Batch Processing

| Параметр | Значение |
|----------|----------|
| Параллельные запросы | Max 2 одновременно |
| Интервал между запросами | 500ms (rate limiting) |
| Очередь | FIFO (First In, First Out) |
| Retry при ошибке | 2 попытки с экспоненциальным backoff |
| Таймаут запроса | 60 секунд |

```typescript
interface QueueItem {
  id: string;
  filePath: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  retryCount: number;
  result?: MetadataResult;
  error?: string;
}
```

---

## 6. ВАЛИДАЦИЯ И СКОРИНГ

### 6.1 Blacklist слов

```typescript
const BLACKLIST_WORDS = [
  // Субъективные слова
  'beautiful', 'gorgeous', 'stunning', 'amazing', 'awesome', 
  'perfect', 'best', 'nice', 'good', 'great', 'wonderful',
  
  // Технические спам-слова
  '4k', '8k', 'hd', 'uhd', 'high quality', 'high resolution',
  'professional', 'stock photo', 'royalty free', 'royalty-free',
  
  // Бессмысленные для поиска
  'wallpaper', 'background image', 'copy space', 'negative space',
  'horizontal', 'vertical', 'square',
  
  // Бренды (частичный список)
  'iphone', 'samsung', 'apple', 'nike', 'adidas', 'google', 
  'microsoft', 'adobe', 'canon', 'nikon', 'sony', 
  'mercedes', 'bmw', 'tesla', 'coca-cola', 'pepsi',
  'facebook', 'instagram', 'twitter', 'tiktok', 'youtube',
  
  // Авторские права
  'copyright', 'watermark', 'logo', 'trademark'
];

const BLACKLIST_BRANDS = [
  // Расширенный список брендов - загружается из отдельного файла
  // brands-blacklist.json
];
```

### 6.2 Валидация ответа AI

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData: MetadataResult;
}

function validateMetadata(data: MetadataResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Title validation
  if (data.title.length < 50) errors.push('Title too short (min 50 chars)');
  if (data.title.length > 200) errors.push('Title too long (max 200 chars)');
  if (/^(a|an|the)\s/i.test(data.title)) warnings.push('Title starts with article');
  
  // Description validation
  if (data.description.length < 100) warnings.push('Description could be longer');
  if (data.description.length > 200) data.description = data.description.slice(0, 200);
  
  // Keywords validation
  if (data.keywords.length < 40) errors.push('Too few keywords (min 40)');
  if (data.keywords.length > 50) data.keywords = data.keywords.slice(0, 50);
  
  // Blacklist filtering
  data.keywords = data.keywords.filter(kw => 
    !BLACKLIST_WORDS.includes(kw.toLowerCase())
  );
  
  // Duplicate removal
  data.keywords = [...new Set(data.keywords.map(k => k.toLowerCase()))];
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData: data
  };
}
```

### 6.3 Формула скоринга

```typescript
function calculateScore(metadata: MetadataResult): number {
  let score = 0;
  
  // Title (max 30 points)
  const titleLen = metadata.title.length;
  if (titleLen >= 50 && titleLen <= 200) {
    score += 20;
    if (titleLen >= 80 && titleLen <= 150) score += 10; // Optimal range
  } else if (titleLen >= 30) {
    score += 10;
  }
  
  // Description (max 30 points)
  const descLen = metadata.description.length;
  if (descLen >= 100 && descLen <= 200) {
    score += 20;
    if (descLen >= 120) score += 10;
  } else if (descLen >= 50) {
    score += 10;
  }
  
  // Keywords (max 40 points)
  const kwCount = metadata.keywords.length;
  if (kwCount >= 45) {
    score += 40;
  } else if (kwCount >= 40) {
    score += 35;
  } else if (kwCount >= 30) {
    score += 25;
  } else {
    score += Math.floor(kwCount * 0.5);
  }
  
  return Math.min(100, score);
}

// Визуализация
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}
```

---

## 7. ОБРАБОТКА ОШИБОК

### 7.1 Типы ошибок

| Код | Тип | Описание | Действие |
|-----|-----|----------|----------|
| `API_401` | Auth Error | Неверный API ключ | Modal: "Проверьте API ключ в настройках" |
| `API_429` | Rate Limit | Превышен лимит запросов | Показать countdown, retry через N сек |
| `API_500` | Server Error | Ошибка сервера OpenRouter | Retry 2 раза, затем skip |
| `API_TIMEOUT` | Timeout | Нет ответа 60+ сек | Retry 1 раз, затем mark as error |
| `FILE_READ` | File Error | Не удалось прочитать файл | Toast: "Файл повреждён или недоступен" |
| `FILE_WRITE` | File Error | Не удалось записать метаданные | Toast: "Ошибка записи. Проверьте права доступа" |
| `FILE_FORMAT` | Validation | Неподдерживаемый формат | Toast: "Поддерживаются: JPG, JPEG, PNG" |
| `FILE_SIZE` | Validation | Файл слишком большой | Toast: "Максимальный размер: 50MB" |
| `JSON_PARSE` | Parse Error | AI вернул невалидный JSON | Retry с другим промптом |

### 7.2 UI для ошибок

```typescript
// Toast notifications (non-blocking)
toast.error('Ошибка API: превышен лимит запросов. Повтор через 30 сек.');

// Modal (blocking)
showModal({
  type: 'error',
  title: 'Ошибка авторизации',
  message: 'API ключ недействителен. Проверьте настройки.',
  actions: [
    { label: 'Открыть настройки', onClick: openSettings },
    { label: 'Закрыть', onClick: closeModal }
  ]
});
```

---

## 8. ЗАПИСЬ МЕТАДАННЫХ

### 8.1 ExifTool Service

```typescript
import { ExifTool } from 'exiftool-vendored';

const exiftool = new ExifTool({ taskTimeoutMillis: 30000 });

interface WriteMetadataParams {
  filePath: string;
  title: string;
  description: string;
  keywords: string[];
  createBackup: boolean;
}

async function writeMetadata(params: WriteMetadataParams): Promise<void> {
  const { filePath, title, description, keywords, createBackup } = params;
  
  // Backup
  if (createBackup) {
    await createBackupFile(filePath);
  }
  
  // Write metadata
  await exiftool.write(filePath, {
    // IPTC fields
    'IPTC:ObjectName': title,
    'IPTC:Caption-Abstract': description,
    'IPTC:Keywords': keywords,
    
    // XMP fields (for compatibility)
    'XMP:Title': title,
    'XMP:Description': description,
    'XMP:Subject': keywords,
  }, {
    writeArgs: ['-overwrite_original'] // No backup from exiftool (we handle it)
  });
}

// Cleanup on app exit
app.on('before-quit', async () => {
  await exiftool.end();
});
```

### 8.2 Маппинг полей

| Приложение | IPTC поле | XMP поле |
|------------|-----------|----------|
| Title | `IPTC:ObjectName` | `XMP:Title` |
| Description | `IPTC:Caption-Abstract` | `XMP:Description` |
| Keywords | `IPTC:Keywords` | `XMP:Subject` |

> [!IMPORTANT]
> Ключевые слова записываются как массив (List), сохраняя порядок. Первый элемент массива — самый важный.

### 8.3 Backup логика

```typescript
async function createBackupFile(filePath: string): Promise<string> {
  const backupDir = userSettings.backupPath || path.join(app.getPath('userData'), 'backups');
  await fs.ensureDir(backupDir);
  
  const timestamp = Date.now();
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${timestamp}_${fileName}`);
  
  await fs.copy(filePath, backupPath);
  return backupPath;
}
```

---

## 9. ХРАНЕНИЕ ДАННЫХ

### 9.1 Electron Store Schema

```typescript
import Store from 'electron-store';

interface AppSettings {
  apiKey: string;          // Encrypted
  model: string;
  systemPrompt: string;
  backupEnabled: boolean;
  backupPath: string;
  metadataLanguage: 'en' | 'ru' | 'es' | 'fr' | 'de';
  windowBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const store = new Store<AppSettings>({
  name: 'settings',
  encryptionKey: 'your-encryption-key', // For API key protection
  defaults: {
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    backupEnabled: true,
    backupPath: '',
    metadataLanguage: 'en',
    windowBounds: { x: 100, y: 100, width: 1200, height: 800 }
  }
});
```

### 9.2 IPC Communication

```typescript
// Main process handlers
ipcMain.handle('settings:get', () => store.store);
ipcMain.handle('settings:set', (_, key: string, value: any) => store.set(key, value));
ipcMain.handle('metadata:generate', async (_, imagePath: string) => { /* ... */ });
ipcMain.handle('metadata:write', async (_, params: WriteMetadataParams) => { /* ... */ });

// Renderer process usage
const settings = await window.api.getSettings();
await window.api.writeMetadata({ filePath, title, description, keywords });
```

---

## 10. ТЕСТИРОВАНИЕ

### 10.1 Требования

| Тип | Инструмент | Покрытие |
|-----|------------|----------|
| Unit Tests | Vitest | ≥70% для бизнес-логики |
| Integration Tests | Vitest | API и ExifTool services |
| E2E Tests | Playwright | Основные пользовательские сценарии |

### 10.2 Тестовые сценарии

```markdown
## Unit Tests
- [ ] Валидация Title (длина, формат)
- [ ] Валидация Keywords (количество, дубликаты)
- [ ] Blacklist фильтрация
- [ ] Расчёт скоринга
- [ ] Парсинг JSON ответа

## Integration Tests
- [ ] OpenRouter API mock
- [ ] ExifTool read/write
- [ ] Settings persistence

## E2E Tests
- [ ] Drag & Drop файлов
- [ ] Полный цикл: загрузка → генерация → редактирование → сохранение
- [ ] Настройки сохраняются между сессиями
- [ ] Обработка ошибок (невалидный ключ)
```

---

## 11. СБОРКА И ДИСТРИБУЦИЯ

### 11.1 Сборка

| Платформа | Формат | Инструмент |
|-----------|--------|------------|
| Windows | `.exe` (NSIS Installer) | electron-builder |
| macOS | `.dmg` | electron-builder |

### 11.2 Команды

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder",
    "package:win": "electron-vite build && electron-builder --win",
    "package:mac": "electron-vite build && electron-builder --mac",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### 11.3 Electron Builder Config

```json
{
  "appId": "com.stockmetadata.pro",
  "productName": "StockMetadata Pro",
  "directories": {
    "output": "dist"
  },
  "win": {
    "target": "nsis",
    "icon": "resources/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "resources/icon.icns",
    "category": "public.app-category.photography"
  },
  "extraResources": [
    {
      "from": "node_modules/exiftool-vendored.exe/bin",
      "to": "exiftool",
      "filter": ["**/*"]
    }
  ]
}
```

---

## 12. КРИТЕРИИ ПРИЁМКИ

### 12.1 MVP Checklist

- [ ] Приложение запускается на Windows и macOS
- [ ] Пользователь может ввести API ключ OpenRouter
- [ ] Drag & Drop загрузка изображений работает
- [ ] AI генерирует метаданные через Gemini Flash
- [ ] Пользователь может редактировать Title, Description
- [ ] Пользователь может переставлять Keywords (Drag & Drop)
- [ ] Метаданные записываются в файл (видны в Photoshop/Bridge)
- [ ] Создаётся backup оригинала (если включено)
- [ ] Настройки сохраняются между сессиями

### 12.2 Финальная проверка

```markdown
1. Установить приложение на чистую Windows машину
2. Ввести валидный OpenRouter API ключ
3. Загрузить 5 тестовых изображений
4. Дождаться генерации метаданных
5. Отредактировать один заголовок вручную
6. Поменять порядок ключевых слов (переместить 3 тега)
7. Сохранить метаданные
8. Открыть файл в Adobe Bridge → проверить IPTC/XMP поля
9. Закрыть приложение, открыть снова → настройки сохранены
```

---

## 13. ПРИЛОЖЕНИЯ

### Приложение A: Полный Blacklist

См. файл `data/blacklist.json`

### Приложение B: Примеры хороших метаданных

| Image | Title | Description | Keywords (первые 10) |
|-------|-------|-------------|---------------------|
| Business woman | Senior businesswoman analyzing financial reports on laptop in modern office | Professional female executive reviewing quarterly data and market trends in corporate workspace | businesswoman, laptop, office, professional, executive, corporate, finance, report, analysis, workplace |
| Landscape | Misty mountain valley at sunrise with pine forest and river | Breathtaking view of fog-covered mountains during golden hour with evergreen trees | mountain, valley, sunrise, mist, fog, forest, pine, river, landscape, nature |

### Приложение C: Wireframes

*[Figma ссылка или приложенные изображения]*

---

**Версия документа:** 4.  
**Последнее обновление:** 23 Декабря 2025  
**Автор:** [Имя]

---

## CHANGELOG

### v4.0 (23 Декабря 2025)
- ✅ Заменён raw Vite на `electron-vite` (специализированный build tool)
- ✅ Обновлён TailwindCSS до v4 (новый синтаксис `@import "tailwindcss"`)
- ✅ Добавлена поддержка PNG формата
- ✅ Добавлена гибкая архитектура File Processor (Strategy Pattern) для простого добавления новых форматов
- ✅ Добавлена библиотека `sharp` для обработки изображений
- ✅ Обновлен Zustand до v5
- ✅ Добавлена дорожная карта форматов (TIFF, EPS, WebP в v2.0)

### v3.0 (Декабрь 2025)
- Начальная детализированная версия ТЗ
