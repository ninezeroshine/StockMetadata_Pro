import { create } from 'zustand'
import type { AppSettings } from '@shared/types'
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '@shared/constants'

interface SettingsState {
    settings: Partial<AppSettings>
    isLoading: boolean
    isSettingsOpen: boolean

    // Actions
    loadSettings: () => Promise<void>
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
    resetSystemPrompt: () => Promise<void>
    openSettings: () => void
    closeSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: {
        model: DEFAULT_MODEL,
        backupEnabled: true,
        metadataLanguage: 'en'
    },
    isLoading: true,
    isSettingsOpen: false,

    loadSettings: async () => {
        try {
            const settings = await window.api.getSettings()
            set({ settings, isLoading: false })
        } catch (error) {
            console.error('Failed to load settings:', error)
            set({ isLoading: false })
        }
    },

    updateSetting: async (key, value) => {
        try {
            await window.api.setSetting(key, value)
            set((state) => ({
                settings: { ...state.settings, [key]: value }
            }))
        } catch (error) {
            console.error('Failed to update setting:', error)
            throw error
        }
    },

    resetSystemPrompt: async () => {
        await get().updateSetting('systemPrompt', DEFAULT_SYSTEM_PROMPT)
    },

    openSettings: () => set({ isSettingsOpen: true }),
    closeSettings: () => set({ isSettingsOpen: false })
}))
