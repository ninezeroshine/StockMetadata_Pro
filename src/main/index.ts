import { app, BrowserWindow, shell, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT } from '../shared/constants'
import type { AppSettings, WriteMetadataParams, DeleteMetadataParams } from '../shared/types'
import { OpenRouterService } from './services/openrouter.service'
import { ExifToolService } from './services/exiftool.service'
import { getProcessor } from './services/file-processor'
import { createBackupFile } from './utils/backup'
import sharp from 'sharp'

// Initialize electron-store
const store = new Store<Omit<AppSettings, 'apiKey'> & { apiKeyEncrypted?: string }>({
    name: 'settings',
    defaults: {
        ...DEFAULT_SETTINGS,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        apiKeyEncrypted: undefined
    }
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
    const bounds = store.get('windowBounds', DEFAULT_SETTINGS.windowBounds)

    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 900,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        title: 'StockMetadata Pro',
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false, // Required for File.path in drag-and-drop
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    // Save window bounds on close
    mainWindow.on('close', () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds()
            store.set('windowBounds', bounds)
        }
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for dev, load from dist for production
    if (process.env.NODE_ENV === 'development') {
        const rendererUrl = process.env['ELECTRON_RENDERER_URL']
        if (rendererUrl) {
            mainWindow.loadURL(rendererUrl)
        } else {
            mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
        }
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// API Key encryption using safeStorage
function getApiKey(): string {
    const encrypted = store.get('apiKeyEncrypted')
    if (!encrypted) return ''

    try {
        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
        }
    } catch {
        console.error('Failed to decrypt API key')
    }
    return ''
}

function setApiKey(plainTextKey: string): void {
    if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(plainTextKey)
        store.set('apiKeyEncrypted', encrypted.toString('base64'))
    } else {
        // Fallback: store in plain text (not recommended, warn user)
        store.set('apiKeyEncrypted', Buffer.from(plainTextKey).toString('base64'))
    }
}

// Register IPC handlers
function registerIpcHandlers(): void {
    // Settings handlers
    ipcMain.handle('settings:get', () => {
        const settings = store.store
        return {
            ...settings,
            apiKey: getApiKey(),
            apiKeyEncrypted: undefined // Don't expose encrypted key
        }
    })

    ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
        if (key === 'apiKey') {
            setApiKey(value as string)
        } else {
            store.set(key as keyof AppSettings, value)
        }
    })

    // File handlers
    ipcMain.handle('files:select', async () => {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
            ]
        })
        return result.filePaths
    })

    ipcMain.handle('files:preview', async (_, filePath: string) => {
        const processor = getProcessor(filePath)
        if (!processor) {
            throw new Error(`Unsupported file format: ${filePath}`)
        }

        // Generate preview with sharp (max 400px for thumbnails)
        const buffer = await sharp(filePath)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer()

        return `data:image/jpeg;base64,${buffer.toString('base64')}`
    })

    // Metadata handlers
    ipcMain.handle('metadata:generate', async (_, imagePath: string) => {
        const apiKey = getApiKey()
        if (!apiKey) {
            throw new Error('API key not configured')
        }

        const service = new OpenRouterService(apiKey, store.get('model'))

        // Prepare image for API (max 1024px, compress)
        const imageBuffer = await sharp(imagePath)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 75 })
            .toBuffer()

        const base64 = imageBuffer.toString('base64')
        const language = store.get('metadataLanguage', 'en')
        const systemPrompt = store.get('systemPrompt', DEFAULT_SYSTEM_PROMPT)
            .replace('{{LANGUAGE}}', language === 'en' ? 'English' :
                language === 'ru' ? 'Russian' :
                    language === 'es' ? 'Spanish' :
                        language === 'fr' ? 'French' : 'German')

        return await service.generateMetadata(base64, systemPrompt)
    })

    ipcMain.handle('metadata:write', async (_, params: WriteMetadataParams) => {
        const { filePath, title, description, keywords, createBackup } = params

        // Create backup if enabled
        if (createBackup) {
            const backupPath = store.get('backupPath', '')
            await createBackupFile(filePath, backupPath)
        }

        // Write metadata using appropriate processor
        const processor = getProcessor(filePath)
        if (!processor) {
            throw new Error(`Unsupported file format: ${filePath}`)
        }

        await processor.writeMetadata(filePath, { title, description, keywords })
    })

    // Metadata reading - get all metadata from file
    ipcMain.handle('metadata:readAll', async (_, filePath: string) => {
        return await ExifToolService.readAllMetadata(filePath)
    })

    // Metadata deletion - delete specific tags or all metadata
    ipcMain.handle('metadata:delete', async (_, params: DeleteMetadataParams) => {
        const { filePath, tags, deleteAll, createBackup } = params

        // Create backup if enabled
        if (createBackup) {
            const backupPath = store.get('backupPath', '')
            await createBackupFile(filePath, backupPath)
        }

        if (deleteAll) {
            await ExifToolService.deleteAllMetadata(filePath)
        } else if (tags.length > 0) {
            await ExifToolService.deleteTags(filePath, tags)
        }
    })

    // App handlers
    ipcMain.handle('app:openExternal', (_, url: string) => {
        return shell.openExternal(url)
    })
}

// App lifecycle
app.whenReady().then(() => {
    // Set app user model id for windows
    app.setAppUserModelId('com.stockmetadata.pro')

    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', async () => {
    await ExifToolService.cleanup()
})
