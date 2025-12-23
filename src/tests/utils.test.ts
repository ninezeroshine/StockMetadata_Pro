import { describe, it, expect, beforeEach } from 'vitest'
import {
    cn,
    getScoreColor,
    getScoreHSL,
    formatFileSize,
    generateId,
    getFileName,
    truncate
} from '@/lib/utils'

describe('Utils', () => {
    describe('cn (classNames)', () => {
        it('should merge class names', () => {
            expect(cn('foo', 'bar')).toBe('foo bar')
        })

        it('should handle conditional classes', () => {
            expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
        })

        it('should handle undefined and null', () => {
            expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
        })
    })

    describe('getScoreColor', () => {
        it('should return score-excellent for scores >= 80', () => {
            expect(getScoreColor(100)).toBe('score-excellent')
            expect(getScoreColor(80)).toBe('score-excellent')
        })

        it('should return score-good for scores >= 60', () => {
            expect(getScoreColor(79)).toBe('score-good')
            expect(getScoreColor(60)).toBe('score-good')
        })

        it('should return score-average for scores >= 40', () => {
            expect(getScoreColor(59)).toBe('score-average')
            expect(getScoreColor(40)).toBe('score-average')
        })

        it('should return score-poor for scores < 40', () => {
            expect(getScoreColor(39)).toBe('score-poor')
            expect(getScoreColor(0)).toBe('score-poor')
        })
    })

    describe('getScoreHSL', () => {
        it('should return correct HSL for different score ranges', () => {
            expect(getScoreHSL(85)).toContain('142.1')  // green
            expect(getScoreHSL(65)).toContain('47.9')   // yellow
            expect(getScoreHSL(45)).toContain('24.6')   // orange
            expect(getScoreHSL(30)).toContain('0')      // red
        })
    })

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 B')
            expect(formatFileSize(500)).toBe('500 B')
        })

        it('should format kilobytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1 KB')
            expect(formatFileSize(2048)).toBe('2 KB')
        })

        it('should format megabytes correctly', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1 MB')
            expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB')
        })
    })

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId()
            const id2 = generateId()
            expect(id1).not.toBe(id2)
        })

        it('should generate string IDs', () => {
            expect(typeof generateId()).toBe('string')
        })

        it('should generate non-empty IDs', () => {
            expect(generateId().length).toBeGreaterThan(0)
        })
    })

    describe('getFileName', () => {
        it('should extract filename from path (forward slashes)', () => {
            expect(getFileName('/path/to/file.jpg')).toBe('file.jpg')
        })

        it('should extract filename from path (backslashes)', () => {
            expect(getFileName('C:\\Users\\Photos\\image.png')).toBe('image.png')
        })

        it('should return the path if no slashes', () => {
            expect(getFileName('file.jpg')).toBe('file.jpg')
        })
    })

    describe('truncate', () => {
        it('should not truncate short strings', () => {
            expect(truncate('hello', 10)).toBe('hello')
        })

        it('should truncate long strings with ellipsis', () => {
            expect(truncate('hello world', 8)).toBe('hello...')
        })

        it('should handle exact length', () => {
            expect(truncate('hello', 5)).toBe('hello')
        })

        it('should handle very short maxLength', () => {
            expect(truncate('hello', 4)).toBe('h...')
        })
    })
})
