import { useEffect, useCallback } from 'react'
import { Settings, FolderOpen, Sun, Moon } from 'lucide-react'

import { useFilesStore } from './stores/files.store'
import { useSettingsStore } from './stores/settings.store'
import { useEditorStore } from './stores/editor.store'

import { DropZone } from './components/DropZone/DropZone'
import { FileList } from './components/FileList/FileList'
import { AttributeEditor } from './components/AttributeEditor/AttributeEditor'
import { SettingsModal } from './components/SettingsModal/SettingsModal'
import { cn } from './lib/utils'

function App() {
    const { files, addFiles, selectFile, selectedFileId, updateFilePreview } = useFilesStore()
    const { loadSettings, openSettings, isSettingsOpen, closeSettings, toggleTheme, resolvedTheme } = useSettingsStore()
    const { loadFromMetadata } = useEditorStore()

    // Load settings on mount
    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    // Load preview for selected file
    const selectedFile = files.find(f => f.id === selectedFileId)
    useEffect(() => {
        if (selectedFile && !selectedFile.preview) {
            window.api.readImagePreview(selectedFile.filePath)
                .then(preview => updateFilePreview(selectedFile.id, preview))
                .catch(console.error)
        }
        // Load metadata into editor when file changes
        loadFromMetadata(selectedFile?.metadata)
    }, [selectedFile?.id, selectedFile?.metadata])

    // Handle file drop
    const handleFileDrop = useCallback((filePaths: string[]) => {
        addFiles(filePaths)
    }, [addFiles])

    // Handle file selection via dialog
    const handleSelectFiles = useCallback(async () => {
        const filePaths = await window.api.selectFiles()
        if (filePaths.length > 0) {
            addFiles(filePaths)
        }
    }, [addFiles])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.ctrlKey || e.metaKey

            if (isMod && e.key === 'o') {
                e.preventDefault()
                handleSelectFiles()
            } else if (isMod && e.key === ',') {
                e.preventDefault()
                openSettings()
            } else if (e.key === 'Escape' && isSettingsOpen) {
                closeSettings()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleSelectFiles, openSettings, isSettingsOpen, closeSettings])

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card no-select">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">StockMetadata Pro</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSelectFiles}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md",
                            "bg-secondary hover:bg-secondary/80 transition-colors"
                        )}
                    >
                        <FolderOpen className="w-4 h-4" />
                        Open Files
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "p-2 rounded-md",
                            "hover:bg-secondary transition-colors"
                        )}
                        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
                    >
                        {resolvedTheme === 'light' ? (
                            <Moon className="w-5 h-5" />
                        ) : (
                            <Sun className="w-5 h-5" />
                        )}
                    </button>

                    <button
                        onClick={openSettings}
                        className={cn(
                            "p-2 rounded-md",
                            "hover:bg-secondary transition-colors"
                        )}
                        title="Settings (Ctrl+,)"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content: Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: File List */}
                <div className="w-[320px] flex flex-col border-r border-border bg-card">
                    <DropZone onDrop={handleFileDrop} />
                    <FileList
                        files={files}
                        selectedId={selectedFileId}
                        onSelect={selectFile}
                    />
                </div>

                {/* Right Panel: Attribute Editor */}
                <div className="flex-1 overflow-auto">
                    {selectedFile ? (
                        <AttributeEditor file={selectedFile} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Drop images here or click "Open Files"</p>
                                <p className="text-sm mt-1">Supported: JPG, JPEG, PNG</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            <SettingsModal open={isSettingsOpen} onClose={closeSettings} />
        </div>
    )
}

export default App
