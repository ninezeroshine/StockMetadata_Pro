import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.api for Electron IPC
const mockApi = {
    getSettings: vi.fn().mockResolvedValue({}),
    setSetting: vi.fn().mockResolvedValue(undefined),
    selectFiles: vi.fn().mockResolvedValue([]),
    readImagePreview: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock'),
    getPathForFile: vi.fn((file: File) => `/mock/path/${file.name}`),
    generateMetadata: vi.fn().mockResolvedValue({
        title: 'Mock Title',
        description: 'Mock Description',
        keywords: ['mock', 'keywords'],
        score: 75
    }),
    writeMetadata: vi.fn().mockResolvedValue(undefined),
    openExternal: vi.fn().mockResolvedValue(undefined)
}

Object.defineProperty(window, 'api', {
    value: mockApi,
    writable: true
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('')
    },
    writable: true
})
