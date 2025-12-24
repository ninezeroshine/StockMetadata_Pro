import { ExifTool, Tags, WriteTags } from 'exiftool-vendored'
import type { Metadata, RawMetadata, TechnicalMetadata } from '../../shared/types'

// Tags to exclude from "other" category (internal/file system tags)
const EXCLUDED_TAGS = new Set([
    'SourceFile', 'FileName', 'Directory', 'FileSize', 'FileModifyDate',
    'FileAccessDate', 'FileCreateDate', 'FilePermissions', 'FileType',
    'FileTypeExtension', 'MIMEType', 'ExifToolVersion', 'errors', 'Warning'
])

// Stock-related tag names
const STOCK_TAGS = new Set([
    'Title', 'ObjectName', 'Description', 'Caption-Abstract', 'ImageDescription',
    'Keywords', 'Subject'
])

// Technical tag names
const TECHNICAL_TAGS = new Set([
    'Make', 'Model', 'LensModel', 'LensInfo', 'ISO', 'FNumber', 'ExposureTime',
    'FocalLength', 'ImageWidth', 'ImageHeight', 'DateTimeOriginal', 'CreateDate',
    'ModifyDate', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'FileSize',
    'FileType', 'MIMEType'
])

export class ExifToolService {
    private static instance: ExifTool | null = null

    static getInstance(): ExifTool {
        if (!this.instance) {
            this.instance = new ExifTool({
                taskTimeoutMillis: 30000,
                maxProcs: 2 // Limit concurrent ExifTool processes
            })
        }
        return this.instance
    }

    static async cleanup(): Promise<void> {
        if (this.instance) {
            await this.instance.end()
            this.instance = null
        }
    }

    /**
     * Read basic stock metadata (Title, Description, Keywords)
     */
    static async readMetadata(filePath: string): Promise<Metadata> {
        const exiftool = this.getInstance()
        const tags = await exiftool.read(filePath)

        const anyTags = tags as Record<string, unknown>

        // Safe type extraction with fallbacks
        const title = this.extractString(anyTags, ['Title', 'ObjectName']) || ''
        const description = this.extractString(anyTags, ['Description', 'Caption-Abstract', 'ImageDescription']) || ''
        const keywords = this.extractKeywords(anyTags)

        return { title, description, keywords }
    }

    /**
     * Read ALL metadata from file, categorized into stock/technical/other
     */
    static async readAllMetadata(filePath: string): Promise<RawMetadata> {
        const exiftool = this.getInstance()
        const tags = await exiftool.read(filePath)
        const anyTags = tags as Record<string, unknown>

        // Extract stock metadata
        const stock: Metadata = {
            title: this.extractString(anyTags, ['Title', 'ObjectName']) || '',
            description: this.extractString(anyTags, ['Description', 'Caption-Abstract', 'ImageDescription']) || '',
            keywords: this.extractKeywords(anyTags)
        }

        // Extract technical metadata
        const technical: TechnicalMetadata = {
            make: this.extractString(anyTags, ['Make']),
            model: this.extractString(anyTags, ['Model']),
            lensModel: this.extractString(anyTags, ['LensModel', 'LensInfo']),
            iso: this.extractNumber(anyTags, ['ISO']),
            fNumber: this.extractNumber(anyTags, ['FNumber']),
            exposureTime: this.extractString(anyTags, ['ExposureTime']),
            focalLength: this.extractString(anyTags, ['FocalLength']),
            imageWidth: this.extractNumber(anyTags, ['ImageWidth']),
            imageHeight: this.extractNumber(anyTags, ['ImageHeight']),
            dateTimeOriginal: this.formatDate(anyTags['DateTimeOriginal']),
            createDate: this.formatDate(anyTags['CreateDate']),
            modifyDate: this.formatDate(anyTags['ModifyDate']),
            gpsLatitude: this.extractNumber(anyTags, ['GPSLatitude']),
            gpsLongitude: this.extractNumber(anyTags, ['GPSLongitude']),
            gpsAltitude: this.extractNumber(anyTags, ['GPSAltitude']),
            fileSize: this.extractString(anyTags, ['FileSize']),
            fileType: this.extractString(anyTags, ['FileType']),
            mimeType: this.extractString(anyTags, ['MIMEType'])
        }

        // Extract other metadata (everything not in stock/technical)
        const other: Record<string, unknown> = {}
        let tagCount = 0

        for (const [key, value] of Object.entries(anyTags)) {
            if (EXCLUDED_TAGS.has(key)) continue
            tagCount++

            if (!STOCK_TAGS.has(key) && !TECHNICAL_TAGS.has(key)) {
                other[key] = value
            }
        }

        return { stock, technical, other, tagCount }
    }

    /**
     * Delete specific tags from file
     */
    static async deleteTags(filePath: string, tagNames: string[]): Promise<void> {
        if (tagNames.length === 0) return

        const exiftool = this.getInstance()
        const tagsToDelete: WriteTags = {}

        for (const tagName of tagNames) {
            // Setting to null deletes the tag
            (tagsToDelete as Record<string, unknown>)[tagName] = null
        }

        await exiftool.write(filePath, tagsToDelete, ['-overwrite_original'])
    }

    /**
     * Delete ALL metadata from file (complete strip)
     */
    static async deleteAllMetadata(filePath: string): Promise<void> {
        const exiftool = this.getInstance()
        // Use ExifTool's -all= flag to strip all metadata
        await exiftool.write(filePath, {}, ['-all=', '-overwrite_original'])
    }

    /**
     * Write JPEG metadata (IPTC + XMP)
     */
    static async writeJpegMetadata(filePath: string, metadata: Metadata): Promise<void> {
        const exiftool = this.getInstance()

        const tags: WriteTags = {
            Title: metadata.title,
            Description: metadata.description,
            Keywords: metadata.keywords,
            Subject: metadata.keywords
        }

        await exiftool.write(filePath, tags, ['-overwrite_original'])
    }

    /**
     * Write PNG metadata (XMP only)
     */
    static async writePngMetadata(filePath: string, metadata: Metadata): Promise<void> {
        const exiftool = this.getInstance()

        const tags: WriteTags = {
            Title: metadata.title,
            Description: metadata.description,
            Subject: metadata.keywords
        }

        await exiftool.write(filePath, tags, ['-overwrite_original'])
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper methods for safe value extraction
    // ─────────────────────────────────────────────────────────────────────────────

    private static extractString(tags: Record<string, unknown>, keys: string[]): string | undefined {
        for (const key of keys) {
            const value = tags[key]
            if (typeof value === 'string' && value.trim()) {
                return value.trim()
            }
        }
        return undefined
    }

    private static extractNumber(tags: Record<string, unknown>, keys: string[]): number | undefined {
        for (const key of keys) {
            const value = tags[key]
            if (typeof value === 'number' && !isNaN(value)) {
                return value
            }
            if (typeof value === 'string') {
                const parsed = parseFloat(value)
                if (!isNaN(parsed)) return parsed
            }
        }
        return undefined
    }

    private static extractKeywords(tags: Record<string, unknown>): string[] {
        const rawKeywords = tags['Keywords'] || tags['Subject']

        if (Array.isArray(rawKeywords)) {
            return rawKeywords.filter((k): k is string => typeof k === 'string')
        }
        if (typeof rawKeywords === 'string' && rawKeywords.trim()) {
            // Handle comma-separated keywords
            return rawKeywords.split(',').map(k => k.trim()).filter(k => k)
        }
        return []
    }

    private static formatDate(value: unknown): string | undefined {
        if (!value) return undefined

        // ExifTool returns ExifDateTime objects, convert to string
        if (typeof value === 'object' && value !== null) {
            const dateObj = value as { toString?: () => string; rawValue?: string }
            if (dateObj.rawValue) return dateObj.rawValue
            if (dateObj.toString) return dateObj.toString()
        }
        if (typeof value === 'string') return value

        return undefined
    }
}

