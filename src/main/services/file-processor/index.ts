import type { FileProcessor } from './types'
import { JpegProcessor } from './jpeg.processor'
import { PngProcessor } from './png.processor'

// Registry of all file processors
const processors: FileProcessor[] = [
    new JpegProcessor(),
    new PngProcessor()
    // Future: new TiffProcessor(), new EpsProcessor(), new WebpProcessor()
]

/**
 * Get the appropriate processor for a file
 */
export function getProcessor(filePath: string): FileProcessor | null {
    return processors.find(p => p.canProcess(filePath)) || null
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
    return processors.flatMap(p => p.supportedExtensions)
}

/**
 * Get all supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
    return processors.flatMap(p => p.mimeTypes)
}

export type { FileProcessor } from './types'
