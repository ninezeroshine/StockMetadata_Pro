import { create } from 'zustand'
import type { AppSettings, ThemeMode } from '@shared/types'
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '@shared/constants'

// Apply theme class to document root
function applyThemeToDocument(theme: ThemeMode): void {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    // Determine actual theme
    let actualTheme: 'light' | 'dark'
    if (theme === 'system') {
        // Check system preference
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
        actualTheme = theme
    }

    // Apply theme class
    root.classList.add(actualTheme)
}

interface SettingsState {
    settings: Partial<AppSettings>
    isLoading: boolean
    isSettingsOpen: boolean
    resolvedTheme: 'light' | 'dark' // Actual theme after resolving 'system'

    // Actions
    loadSettings: () => Promise<void>
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
    resetSystemPrompt: () => Promise<void>
    openSettings: () => void
    closeSettings: () => void
    toggleTheme: () => void
    setTheme: (theme: ThemeMode) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: {
        model: DEFAULT_MODEL,
        backupEnabled: true,
        metadataLanguage: 'en',
        theme: 'light' // Default to light
    },
    isLoading: true,
    isSettingsOpen: false,
    resolvedTheme: 'light',

    loadSettings: async () => {
        try {
            const settings = await window.api.getSettings()
            const theme = settings.theme || 'light'

            // Apply theme immediately on load
            applyThemeToDocument(theme)

            // Resolve the actual theme
            const resolvedTheme = theme === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme

            set({ settings, isLoading: false, resolvedTheme })
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

            // If theme changed, apply it
            if (key === 'theme') {
                const theme = value as ThemeMode
                applyThemeToDocument(theme)
                const resolvedTheme = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme
                set({ resolvedTheme })
            }
        } catch (error) {
            console.error('Failed to update setting:', error)
            throw error
        }
    },

    resetSystemPrompt: async () => {
        await get().updateSetting('systemPrompt', DEFAULT_SYSTEM_PROMPT)
    },

    openSettings: () => set({ isSettingsOpen: true }),
    closeSettings: () => set({ isSettingsOpen: false }),

    toggleTheme: () => {
        const { settings, updateSetting } = get()
        const currentTheme = settings.theme || 'light'
        const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light'
        updateSetting('theme', newTheme)
    },

    setTheme: (theme: ThemeMode) => {
        get().updateSetting('theme', theme)
    }
}))

