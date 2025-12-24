import { create } from 'zustand'
import type { FileItem, MetadataResult, RawMetadata } from '@shared/types'
import { generateId, getFileName } from '../lib/utils'
import { REQUEST_INTERVAL_MS } from '@shared/constants'

// Concurrency limit for file operations
const CONCURRENCY_LIMIT = 3

interface FilesState {
    files: FileItem[]
    selectedFileId: string | null
    isProcessingBatch: boolean
    isLoadingMetadata: boolean
    batchProgress: { current: number; total: number }

    // Actions
    addFiles: (filePaths: string[]) => void
    removeFile: (id: string) => void
    clearAll: () => void
    selectFile: (id: string | null) => void
    updateFileStatus: (id: string, status: FileItem['status'], error?: string) => void
    updateFileMetadata: (id: string, metadata: MetadataResult) => void
    updateFilePreview: (id: string, preview: string) => void
    updateExistingMetadata: (id: string, existingMetadata: RawMetadata) => void
    incrementRetry: (id: string) => void

    // Batch processing
    loadAllPreviews: () => Promise<void>
    loadAllExistingMetadata: () => Promise<void>
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
    isLoadingMetadata: false,
    batchProgress: { current: 0, total: 0 },

    addFiles: (filePaths) => {
        const newFiles: FileItem[] = filePaths.map((filePath) => ({
            id: generateId(),
            filePath,
            fileName: getFileName(filePath),
            status: 'pending' as const,
            retryCount: 0,
            hasExistingMetadata: false
        }))

        set((state) => ({
            files: [...state.files, ...newFiles],
            selectedFileId: state.selectedFileId || newFiles[0]?.id || null
        }))

        // Auto-load previews and existing metadata for new files in background
        setTimeout(() => {
            get().loadAllPreviews()
            get().loadAllExistingMetadata()
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
        set({
            files: [],
            selectedFileId: null,
            isProcessingBatch: false,
            isLoadingMetadata: false,
            batchProgress: { current: 0, total: 0 }
        })
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

    updateExistingMetadata: (id, existingMetadata) => {
        const hasContent = !!(
            existingMetadata.stock.title ||
            existingMetadata.stock.description ||
            existingMetadata.stock.keywords.length > 0 ||
            existingMetadata.tagCount > 0
        )

        set((state) => ({
            files: state.files.map((f) =>
                f.id === id ? {
                    ...f,
                    existingMetadata,
                    hasExistingMetadata: hasContent
                } : f
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

        // Process in parallel with concurrency limit
        const chunks: FileItem[][] = []
        for (let i = 0; i < filesWithoutPreview.length; i += CONCURRENCY_LIMIT) {
            chunks.push(filesWithoutPreview.slice(i, i + CONCURRENCY_LIMIT))
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

    // Load existing metadata for all files (with concurrency limit)
    loadAllExistingMetadata: async () => {
        const { files, updateExistingMetadata } = get()
        const filesWithoutMetadata = files.filter(f => !f.existingMetadata)

        if (filesWithoutMetadata.length === 0) return

        set({ isLoadingMetadata: true })

        // Process in parallel with concurrency limit
        const chunks: FileItem[][] = []
        for (let i = 0; i < filesWithoutMetadata.length; i += CONCURRENCY_LIMIT) {
            chunks.push(filesWithoutMetadata.slice(i, i + CONCURRENCY_LIMIT))
        }

        for (const chunk of chunks) {
            await Promise.all(
                chunk.map(async (file) => {
                    try {
                        const metadata = await window.api.readAllMetadata(file.filePath)
                        updateExistingMetadata(file.id, metadata)
                    } catch (error) {
                        console.error('Failed to load metadata for', file.fileName, error)
                    }
                })
            )
        }

        set({ isLoadingMetadata: false })
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

