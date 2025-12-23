import { ExifTool, Tags, WriteTags } from 'exiftool-vendored'
import type { Metadata } from '../../shared/types'

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

    static async readMetadata(filePath: string): Promise<Metadata> {
        const exiftool = this.getInstance()
        const tags = await exiftool.read(filePath)

        // Use type assertion for dynamic tag access
        const anyTags = tags as Record<string, unknown>

        // Safe type extraction
        const title = typeof anyTags['Title'] === 'string' ? anyTags['Title'] :
            typeof anyTags['ObjectName'] === 'string' ? anyTags['ObjectName'] : ''

        const description = typeof anyTags['Description'] === 'string' ? anyTags['Description'] :
            typeof anyTags['Caption-Abstract'] === 'string' ? anyTags['Caption-Abstract'] : ''

        let keywords: string[] = []
        const rawKeywords = anyTags['Keywords'] || anyTags['Subject']
        if (Array.isArray(rawKeywords)) {
            keywords = rawKeywords.filter((k): k is string => typeof k === 'string')
        } else if (typeof rawKeywords === 'string') {
            keywords = [rawKeywords]
        }

        return { title, description, keywords }
    }

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

    static async writePngMetadata(filePath: string, metadata: Metadata): Promise<void> {
        const exiftool = this.getInstance()

        const tags: WriteTags = {
            Title: metadata.title,
            Description: metadata.description,
            Subject: metadata.keywords
        }

        await exiftool.write(filePath, tags, ['-overwrite_original'])
    }
}
