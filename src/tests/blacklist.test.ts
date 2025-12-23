import { describe, it, expect } from 'vitest'
import { isBlacklisted, filterBlacklisted, FULL_BLACKLIST } from '@shared/blacklist'

describe('Blacklist', () => {
    describe('isBlacklisted', () => {
        it('should return true for blacklisted words', () => {
            expect(isBlacklisted('beautiful')).toBe(true)
            expect(isBlacklisted('stunning')).toBe(true)
            expect(isBlacklisted('4k')).toBe(true)
            expect(isBlacklisted('stock photo')).toBe(true)
        })

        it('should return true for brand names (case insensitive)', () => {
            expect(isBlacklisted('Apple')).toBe(true)
            expect(isBlacklisted('NIKE')).toBe(true)
            expect(isBlacklisted('samsung')).toBe(true)
        })

        it('should return false for allowed words', () => {
            expect(isBlacklisted('nature')).toBe(false)
            expect(isBlacklisted('mountain')).toBe(false)
            expect(isBlacklisted('coffee')).toBe(false)
            expect(isBlacklisted('business')).toBe(false)
            expect(isBlacklisted('sunset')).toBe(false)
        })
    })

    describe('filterBlacklisted', () => {
        it('should remove blacklisted words from array', () => {
            const input = ['nature', 'beautiful', 'mountain', 'stunning', 'forest']
            const result = filterBlacklisted(input)
            expect(result).toEqual(['nature', 'mountain', 'forest'])
        })

        it('should remove brand names from array', () => {
            const input = ['phone', 'apple', 'technology', 'samsung']
            const result = filterBlacklisted(input)
            expect(result).toEqual(['phone', 'technology'])
        })

        it('should return empty array if all words are blacklisted', () => {
            const input = ['beautiful', 'gorgeous', 'stunning']
            const result = filterBlacklisted(input)
            expect(result).toEqual([])
        })

        it('should handle empty array', () => {
            const result = filterBlacklisted([])
            expect(result).toEqual([])
        })
    })

    describe('FULL_BLACKLIST', () => {
        it('should be a Set with entries', () => {
            expect(FULL_BLACKLIST).toBeInstanceOf(Set)
            expect(FULL_BLACKLIST.size).toBeGreaterThan(50)
        })
    })
})
