// Metadata types
export interface Metadata {
    title: string
    description: string
    keywords: string[]
}

export interface MetadataResult extends Metadata {
    score: number
}

// Technical metadata (camera info, dates, etc.) - read-only display
export interface TechnicalMetadata {
    // Camera info
    make?: string
    model?: string
    lensModel?: string

    // Capture settings
    iso?: number
    fNumber?: number
    exposureTime?: string
    focalLength?: string

    // Dimensions
    imageWidth?: number
    imageHeight?: number

    // Dates
    dateTimeOriginal?: string
    createDate?: string
    modifyDate?: string

    // Location
    gpsLatitude?: number
    gpsLongitude?: number
    gpsAltitude?: number

    // File info
    fileSize?: string
    fileType?: string
    mimeType?: string
}

// Full metadata from file (categorized)
export interface RawMetadata {
    stock: Metadata                    // Title, Description, Keywords
    technical: TechnicalMetadata       // Camera, Date, Size, GPS, etc.
    other: Record<string, unknown>     // All other tags (for advanced view)
    tagCount: number                   // Total number of tags in file
}

// File processing types
export interface FileItem {
    id: string
    filePath: string
    fileName: string
    status: 'pending' | 'processing' | 'done' | 'error'
    preview?: string // base64 data URL
    metadata?: MetadataResult // AI-generated metadata
    existingMetadata?: RawMetadata // Metadata read from file
    hasExistingMetadata?: boolean // Quick flag
    error?: string
    retryCount: number
}

// Settings types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
    apiKey: string // Stored encrypted via safeStorage
    model: string
    systemPrompt: string
    backupEnabled: boolean
    backupPath: string
    metadataLanguage: 'en' | 'ru' | 'es' | 'fr' | 'de'
    theme: ThemeMode
    windowBounds: {
        x: number
        y: number
        width: number
        height: number
    }
}

// IPC types
export interface WriteMetadataParams {
    filePath: string
    title: string
    description: string
    keywords: string[]
    createBackup: boolean
}

// Delete metadata params
export interface DeleteMetadataParams {
    filePath: string
    tags: string[]       // Specific tags to delete (empty = delete all)
    deleteAll: boolean   // If true, delete ALL metadata
    createBackup: boolean
}

// Validation types
export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    cleanedData: Metadata
}

// API exposed to renderer
export interface ElectronAPI {
    // Settings
    getSettings: () => Promise<Partial<AppSettings>>
    setSetting: (key: keyof AppSettings, value: unknown) => Promise<void>

    // Files
    selectFiles: () => Promise<string[]>
    readImagePreview: (filePath: string) => Promise<string>
    getPathForFile: (file: File) => string

    // Metadata - Generation & Writing
    generateMetadata: (imagePath: string) => Promise<MetadataResult>
    writeMetadata: (params: WriteMetadataParams) => Promise<void>

    // Metadata - Reading & Deletion
    readAllMetadata: (filePath: string) => Promise<RawMetadata>
    deleteMetadata: (params: DeleteMetadataParams) => Promise<void>

    // App
    openExternal: (url: string) => Promise<void>
}

declare global {
    interface Window {
        api: ElectronAPI
    }
}

