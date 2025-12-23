import type { Metadata } from '../../../shared/types'

export interface FileProcessor {
    readonly supportedExtensions: string[]
    readonly mimeTypes: string[]

    canProcess(filePath: string): boolean
    extractPreview(filePath: string): Promise<Buffer>
    readMetadata(filePath: string): Promise<Metadata>
    writeMetadata(filePath: string, metadata: Metadata): Promise<void>
}
