import { create } from 'zustand'
import type { Metadata } from '@shared/types'

interface EditorState {
    // Current editing state (separate from saved metadata)
    editedTitle: string
    editedDescription: string
    editedKeywords: string[]
    hasChanges: boolean
    isSaving: boolean
    isGenerating: boolean

    // Actions
    setEditedTitle: (title: string) => void
    setEditedDescription: (description: string) => void
    setEditedKeywords: (keywords: string[]) => void
    addKeyword: (keyword: string) => void
    removeKeyword: (index: number) => void
    reorderKeywords: (fromIndex: number, toIndex: number) => void
    loadFromMetadata: (metadata: Metadata | undefined) => void
    setIsSaving: (saving: boolean) => void
    setIsGenerating: (generating: boolean) => void
    reset: () => void

    // Computed
    getMetadata: () => Metadata
}

export const useEditorStore = create<EditorState>((set, get) => ({
    editedTitle: '',
    editedDescription: '',
    editedKeywords: [],
    hasChanges: false,
    isSaving: false,
    isGenerating: false,

    setEditedTitle: (title) => {
        set({ editedTitle: title, hasChanges: true })
    },

    setEditedDescription: (description) => {
        set({ editedDescription: description, hasChanges: true })
    },

    setEditedKeywords: (keywords) => {
        set({ editedKeywords: keywords, hasChanges: true })
    },

    addKeyword: (keyword) => {
        const trimmed = keyword.toLowerCase().trim()
        if (!trimmed) return

        set((state) => {
            // Don't add duplicates
            if (state.editedKeywords.includes(trimmed)) return state
            return {
                editedKeywords: [...state.editedKeywords, trimmed],
                hasChanges: true
            }
        })
    },

    removeKeyword: (index) => {
        set((state) => ({
            editedKeywords: state.editedKeywords.filter((_, i) => i !== index),
            hasChanges: true
        }))
    },

    reorderKeywords: (fromIndex, toIndex) => {
        set((state) => {
            const newKeywords = [...state.editedKeywords]
            const [removed] = newKeywords.splice(fromIndex, 1)
            newKeywords.splice(toIndex, 0, removed)
            return { editedKeywords: newKeywords, hasChanges: true }
        })
    },

    loadFromMetadata: (metadata) => {
        if (metadata) {
            set({
                editedTitle: metadata.title,
                editedDescription: metadata.description,
                editedKeywords: [...metadata.keywords],
                hasChanges: false
            })
        } else {
            set({
                editedTitle: '',
                editedDescription: '',
                editedKeywords: [],
                hasChanges: false
            })
        }
    },

    setIsSaving: (saving) => set({ isSaving: saving }),
    setIsGenerating: (generating) => set({ isGenerating: generating }),

    reset: () => {
        set({
            editedTitle: '',
            editedDescription: '',
            editedKeywords: [],
            hasChanges: false,
            isSaving: false,
            isGenerating: false
        })
    },

    getMetadata: () => ({
        title: get().editedTitle,
        description: get().editedDescription,
        keywords: get().editedKeywords
    })
}))
