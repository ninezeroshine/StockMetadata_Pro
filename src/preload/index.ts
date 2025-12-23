import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { ElectronAPI, AppSettings, WriteMetadataParams, MetadataResult } from '../shared/types'

// Extended API with file path helper
interface ExtendedElectronAPI extends ElectronAPI {
    getPathForFile: (file: File) => string
}

const api: ExtendedElectronAPI = {
    // Settings
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key: keyof AppSettings, value: unknown) => ipcRenderer.invoke('settings:set', key, value),

    // Files
    selectFiles: () => ipcRenderer.invoke('files:select'),
    readImagePreview: (filePath: string) => ipcRenderer.invoke('files:preview', filePath),

    // Get file path from File object (for drag and drop)
    getPathForFile: (file: File) => webUtils.getPathForFile(file),

    // Metadata
    generateMetadata: (imagePath: string): Promise<MetadataResult> =>
        ipcRenderer.invoke('metadata:generate', imagePath),
    writeMetadata: (params: WriteMetadataParams) =>
        ipcRenderer.invoke('metadata:write', params),

    // App
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url)
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api)
