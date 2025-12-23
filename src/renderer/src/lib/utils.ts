import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Get score color class based on score value
 */
export function getScoreColor(score: number): string {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-average'
    return 'score-poor'
}

/**
 * Get score color for progress bar (HSL values)
 */
export function getScoreHSL(score: number): string {
    if (score >= 80) return 'hsl(142.1 76.2% 36.3%)'
    if (score >= 60) return 'hsl(47.9 95.8% 53.1%)'
    if (score >= 40) return 'hsl(24.6 95% 53.1%)'
    return 'hsl(0 84.2% 60.2%)'
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Generate unique ID for file items
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get file name from path
 */
export function getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || filePath
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}
