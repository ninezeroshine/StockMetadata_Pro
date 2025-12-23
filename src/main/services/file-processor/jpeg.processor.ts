import { BaseProcessor } from './base.processor'
import { ExifToolService } from '../exiftool.service'
import type { Metadata } from '../../../shared/types'

export class JpegProcessor extends BaseProcessor {
    readonly supportedExtensions = ['.jpg', '.jpeg']
    readonly mimeTypes = ['image/jpeg']

    async readMetadata(filePath: string): Promise<Metadata> {
        return ExifToolService.readMetadata(filePath)
    }

    async writeMetadata(filePath: string, metadata: Metadata): Promise<void> {
        await ExifToolService.writeJpegMetadata(filePath, metadata)
    }
}
