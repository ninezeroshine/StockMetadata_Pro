import { BaseProcessor } from './base.processor'
import { ExifToolService } from '../exiftool.service'
import type { Metadata } from '../../../shared/types'

export class PngProcessor extends BaseProcessor {
    readonly supportedExtensions = ['.png']
    readonly mimeTypes = ['image/png']

    async readMetadata(filePath: string): Promise<Metadata> {
        return ExifToolService.readMetadata(filePath)
    }

    async writeMetadata(filePath: string, metadata: Metadata): Promise<void> {
        // PNG doesn't support IPTC, only XMP
        await ExifToolService.writePngMetadata(filePath, metadata)
    }
}
