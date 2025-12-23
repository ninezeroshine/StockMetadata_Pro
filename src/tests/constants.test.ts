import { describe, it, expect } from 'vitest'
import {
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    DESCRIPTION_MIN_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    KEYWORDS_MIN_COUNT,
    KEYWORDS_MAX_COUNT,
    MAX_FILE_SIZE_MB,
    SUPPORTED_EXTENSIONS,
    DEFAULT_MODEL
} from '@shared/constants'

describe('Constants', () => {
    describe('Title constraints', () => {
        it('should have valid title length range', () => {
            expect(TITLE_MIN_LENGTH).toBeGreaterThan(0)
            expect(TITLE_MAX_LENGTH).toBeGreaterThan(TITLE_MIN_LENGTH)
            expect(TITLE_MIN_LENGTH).toBe(50)
            expect(TITLE_MAX_LENGTH).toBe(200)
        })
    })

    describe('Description constraints', () => {
        it('should have valid description length range', () => {
            expect(DESCRIPTION_MIN_LENGTH).toBeGreaterThan(0)
            expect(DESCRIPTION_MAX_LENGTH).toBeGreaterThan(DESCRIPTION_MIN_LENGTH)
            expect(DESCRIPTION_MIN_LENGTH).toBe(100)
            expect(DESCRIPTION_MAX_LENGTH).toBe(200)
        })
    })

    describe('Keywords constraints', () => {
        it('should have valid keywords count range', () => {
            expect(KEYWORDS_MIN_COUNT).toBeGreaterThan(0)
            expect(KEYWORDS_MAX_COUNT).toBeGreaterThanOrEqual(KEYWORDS_MIN_COUNT)
            expect(KEYWORDS_MIN_COUNT).toBe(40)
            expect(KEYWORDS_MAX_COUNT).toBe(50)
        })
    })

    describe('File constraints', () => {
        it('should have reasonable file size limit', () => {
            expect(MAX_FILE_SIZE_MB).toBe(50)
        })

        it('should support JPG, JPEG, PNG formats', () => {
            expect(SUPPORTED_EXTENSIONS).toContain('.jpg')
            expect(SUPPORTED_EXTENSIONS).toContain('.jpeg')
            expect(SUPPORTED_EXTENSIONS).toContain('.png')
        })
    })

    describe('Default model', () => {
        it('should have valid OpenRouter model ID', () => {
            expect(DEFAULT_MODEL).toBe('google/gemini-2.0-flash-001')
        })
    })
})
