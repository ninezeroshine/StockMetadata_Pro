// Metadata types
export interface Metadata {
    title: string
    description: string
    keywords: string[]
}

export interface MetadataResult extends Metadata {
    score: number
}

// File processing types
export interface FileItem {
    id: string
    filePath: string
    fileName: string
    status: 'pending' | 'processing' | 'done' | 'error'
    preview?: string // base64 data URL
    metadata?: MetadataResult
    error?: string
    retryCount: number
}

// Settings types
export interface AppSettings {
    apiKey: string // Stored encrypted via safeStorage
    model: string
    systemPrompt: string
    backupEnabled: boolean
    backupPath: string
    metadataLanguage: 'en' | 'ru' | 'es' | 'fr' | 'de'
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

    // Metadata
    generateMetadata: (imagePath: string) => Promise<MetadataResult>
    writeMetadata: (params: WriteMetadataParams) => Promise<void>

    // App
    openExternal: (url: string) => Promise<void>
}

declare global {
    interface Window {
        api: ElectronAPI
    }
}
