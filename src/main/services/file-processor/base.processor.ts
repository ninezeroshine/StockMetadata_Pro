import { extname } from 'path'
import sharp from 'sharp'
import type { FileProcessor } from './types'
import type { Metadata } from '../../../shared/types'
import { MAX_PREVIEW_RESOLUTION } from '../../../shared/constants'

export abstract class BaseProcessor implements FileProcessor {
    abstract readonly supportedExtensions: string[]
    abstract readonly mimeTypes: string[]

    canProcess(filePath: string): boolean {
        const ext = extname(filePath).toLowerCase()
        return this.supportedExtensions.includes(ext)
    }

    async extractPreview(filePath: string): Promise<Buffer> {
        return sharp(filePath)
            .resize(MAX_PREVIEW_RESOLUTION, MAX_PREVIEW_RESOLUTION, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer()
    }

    abstract readMetadata(filePath: string): Promise<Metadata>
    abstract writeMetadata(filePath: string, metadata: Metadata): Promise<void>
}
