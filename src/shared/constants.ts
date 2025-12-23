import type { AppSettings } from './types'

// Default AI model
export const DEFAULT_MODEL = 'google/gemini-2.0-flash-001'

// File constraints
export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MIN_RESOLUTION = 500
export const MAX_PREVIEW_RESOLUTION = 1024
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png']

// Metadata constraints
export const TITLE_MIN_LENGTH = 50
export const TITLE_MAX_LENGTH = 200
export const DESCRIPTION_MIN_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 200
export const KEYWORDS_MIN_COUNT = 40
export const KEYWORDS_MAX_COUNT = 50

// API constraints
export const MAX_CONCURRENT_REQUESTS = 2
export const REQUEST_INTERVAL_MS = 500
export const REQUEST_TIMEOUT_MS = 60000
export const MAX_RETRY_COUNT = 2

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    model: DEFAULT_MODEL,
    systemPrompt: '', // Will be set from DEFAULT_SYSTEM_PROMPT
    backupEnabled: true,
    backupPath: '',
    metadataLanguage: 'en',
    windowBounds: { x: 100, y: 100, width: 1200, height: 800 }
}

// Default system prompt
export const DEFAULT_SYSTEM_PROMPT = `You are an expert stock photography metadata specialist. Your task is to analyze images and generate SEO-optimized metadata for microstock platforms (Shutterstock, Adobe Stock, iStock).

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

## LANGUAGE
Generate all content in: {{LANGUAGE}}

## BLACKLIST - NEVER USE THESE WORDS:
beautiful, gorgeous, stunning, amazing, awesome, perfect, best, nice, good, great,
4k, 8k, hd, high quality, professional, stock photo, royalty free, 
wallpaper, background image, copy space, negative space,
© copyright, watermark, logo`
