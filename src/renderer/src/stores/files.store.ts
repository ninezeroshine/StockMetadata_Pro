import { create } from 'zustand'
import type { FileItem, MetadataResult } from '@shared/types'
import { generateId, getFileName } from '../lib/utils'
import { MAX_CONCURRENT_REQUESTS, REQUEST_INTERVAL_MS } from '@shared/constants'

interface FilesState {
    files: FileItem[]
    selectedFileId: string | null
    isProcessingBatch: boolean
    batchProgress: { current: number; total: number }

    // Actions
    addFiles: (filePaths: string[]) => void
    removeFile: (id: string) => void
    clearAll: () => void
    selectFile: (id: string | null) => void
    updateFileStatus: (id: string, status: FileItem['status'], error?: string) => void
    updateFileMetadata: (id: string, metadata: MetadataResult) => void
    updateFilePreview: (id: string, preview: string) => void
    incrementRetry: (id: string) => void

    // Batch processing
    loadAllPreviews: () => Promise<void>
    generateAllMetadata: () => Promise<void>
    stopBatchProcessing: () => void

    // Computed
    getSelectedFile: () => FileItem | undefined
    getPendingFiles: () => FileItem[]
}

// Flag to stop batch processing
let stopBatchFlag = false

export const useFilesStore = create<FilesState>((set, get) => ({
    files: [],
    selectedFileId: null,
    isProcessingBatch: false,
    batchProgress: { current: 0, total: 0 },

    addFiles: (filePaths) => {
        const newFiles: FileItem[] = filePaths.map((filePath) => ({
            id: generateId(),
            filePath,
            fileName: getFileName(filePath),
            status: 'pending' as const,
            retryCount: 0
        }))

        set((state) => ({
            files: [...state.files, ...newFiles],
            selectedFileId: state.selectedFileId || newFiles[0]?.id || null
        }))

        // Auto-load previews for new files in background
        setTimeout(() => {
            get().loadAllPreviews()
        }, 100)
    },

    removeFile: (id) => {
        set((state) => {
            const newFiles = state.files.filter((f) => f.id !== id)
            const newSelectedId = state.selectedFileId === id
                ? newFiles[0]?.id || null
                : state.selectedFileId
            return { files: newFiles, selectedFileId: newSelectedId }
        })
    },

    clearAll: () => {
        stopBatchFlag = true
        set({ files: [], selectedFileId: null, isProcessingBatch: false, batchProgress: { current: 0, total: 0 } })
    },

    selectFile: (id) => {
        set({ selectedFileId: id })
    },

    updateFileStatus: (id, status, error) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.id === id ? { ...f, status, error } : f
            )
        }))
    },

    updateFileMetadata: (id, metadata) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.id === id ? { ...f, metadata, status: 'done' as const } : f
            )
        }))
    },

    updateFilePreview: (id, preview) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.id === id ? { ...f, preview } : f
            )
        }))
    },

    incrementRetry: (id) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.id === id ? { ...f, retryCount: f.retryCount + 1 } : f
            )
        }))
    },

    // Load previews for all files that don't have one (with concurrency limit)
    loadAllPreviews: async () => {
        const { files, updateFilePreview } = get()
        const filesWithoutPreview = files.filter(f => !f.preview)

        if (filesWithoutPreview.length === 0) return

        // Process in parallel with concurrency limit (3 at a time)
        const concurrency = 3
        const chunks: FileItem[][] = []
        for (let i = 0; i < filesWithoutPreview.length; i += concurrency) {
            chunks.push(filesWithoutPreview.slice(i, i + concurrency))
        }

        for (const chunk of chunks) {
            await Promise.all(
                chunk.map(async (file) => {
                    try {
                        const preview = await window.api.readImagePreview(file.filePath)
                        updateFilePreview(file.id, preview)
                    } catch (error) {
                        console.error('Failed to load preview for', file.fileName, error)
                    }
                })
            )
        }
    },

    // Generate metadata for all pending files
    generateAllMetadata: async () => {
        const { files, updateFileStatus, updateFileMetadata } = get()
        const pendingFiles = files.filter(f => f.status === 'pending')

        if (pendingFiles.length === 0) return

        stopBatchFlag = false
        set({
            isProcessingBatch: true,
            batchProgress: { current: 0, total: pendingFiles.length }
        })

        let processed = 0

        for (const file of pendingFiles) {
            if (stopBatchFlag) {
                console.log('Batch processing stopped by user')
                break
            }

            updateFileStatus(file.id, 'processing')

            try {
                const result = await window.api.generateMetadata(file.filePath)
                updateFileMetadata(file.id, result)
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Generation failed'
                updateFileStatus(file.id, 'error', message)
            }

            processed++
            set({ batchProgress: { current: processed, total: pendingFiles.length } })

            // Rate limiting: wait between requests
            if (processed < pendingFiles.length && !stopBatchFlag) {
                await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL_MS))
            }
        }

        set({ isProcessingBatch: false })
    },

    stopBatchProcessing: () => {
        stopBatchFlag = true
        set({ isProcessingBatch: false })
    },

    getSelectedFile: () => {
        const state = get()
        return state.files.find((f) => f.id === state.selectedFileId)
    },

    getPendingFiles: () => {
        return get().files.filter((f) => f.status === 'pending')
    }
}))
