import { useCallback, useState } from 'react'
import type { FileItem } from '@shared/types'
import { useEditorStore } from '@/stores/editor.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useFilesStore } from '@/stores/files.store'
import { KeywordList } from '@/components/KeywordList/KeywordList'
import { ScoreBar } from '@/components/ScoreBar/ScoreBar'
import { cn, getScoreColor } from '@/lib/utils'
import { RefreshCw, Copy, Save, Loader2 } from 'lucide-react'
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@shared/constants'

interface AttributeEditorProps {
    file: FileItem
}

export function AttributeEditor({ file }: AttributeEditorProps) {
    const {
        editedTitle,
        editedDescription,
        editedKeywords,
        setEditedTitle,
        setEditedDescription,
        addKeyword,
        removeKeyword,
        reorderKeywords,
        hasChanges,
        isSaving,
        isGenerating,
        setIsSaving,
        setIsGenerating
    } = useEditorStore()

    const { settings } = useSettingsStore()
    const { updateFileMetadata, updateFileStatus } = useFilesStore()
    const [newKeyword, setNewKeyword] = useState('')

    const score = file.metadata?.score || 0

    // Generate metadata
    const handleGenerate = useCallback(async () => {
        if (!settings.apiKey) {
            alert('Please configure your API key in settings')
            return
        }

        setIsGenerating(true)
        updateFileStatus(file.id, 'processing')

        try {
            const result = await window.api.generateMetadata(file.filePath)
            updateFileMetadata(file.id, result)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Generation failed'
            updateFileStatus(file.id, 'error', message)
        } finally {
            setIsGenerating(false)
        }
    }, [file.id, file.filePath, settings.apiKey, setIsGenerating, updateFileMetadata, updateFileStatus])

    // Save metadata to file
    const handleSave = useCallback(async () => {
        setIsSaving(true)

        try {
            await window.api.writeMetadata({
                filePath: file.filePath,
                title: editedTitle,
                description: editedDescription,
                keywords: editedKeywords,
                createBackup: settings.backupEnabled ?? true
            })
            // Update store with saved values
            updateFileMetadata(file.id, {
                title: editedTitle,
                description: editedDescription,
                keywords: editedKeywords,
                score
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Save failed'
            alert(`Failed to save: ${message}`)
        } finally {
            setIsSaving(false)
        }
    }, [
        file.id,
        file.filePath,
        editedTitle,
        editedDescription,
        editedKeywords,
        settings.backupEnabled,
        score,
        setIsSaving,
        updateFileMetadata
    ])

    // Copy all metadata to clipboard
    const handleCopyAll = useCallback(() => {
        const text = [
            `Title: ${editedTitle}`,
            `Description: ${editedDescription}`,
            `Keywords: ${editedKeywords.join(', ')}`
        ].join('\n\n')

        navigator.clipboard.writeText(text)
    }, [editedTitle, editedDescription, editedKeywords])

    // Add keyword on Enter
    const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newKeyword.trim()) {
            addKeyword(newKeyword)
            setNewKeyword('')
        }
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto">
            {/* Preview Image */}
            <div className="flex justify-center">
                <div className="max-w-md max-h-64 rounded-lg overflow-hidden bg-muted">
                    {file.preview ? (
                        <img
                            src={file.preview}
                            alt={file.fileName}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-64 h-48 flex items-center justify-center text-muted-foreground">
                            Loading preview...
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Title</label>
                    <span className={cn(
                        "text-xs",
                        editedTitle.length > TITLE_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                    )}>
                        {editedTitle.length}/{TITLE_MAX_LENGTH}
                    </span>
                </div>
                <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter title..."
                    className={cn(
                        "w-full px-3 py-2 rounded-md border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Description</label>
                    <span className={cn(
                        "text-xs",
                        editedDescription.length > DESCRIPTION_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                    )}>
                        {editedDescription.length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                </div>
                <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Enter description..."
                    rows={3}
                    className={cn(
                        "w-full px-3 py-2 rounded-md border bg-background resize-none",
                        "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Keywords (Drag to reorder)</label>
                    <span className="text-xs text-muted-foreground">
                        {editedKeywords.length}/50
                    </span>
                </div>

                <KeywordList
                    keywords={editedKeywords}
                    onRemove={removeKeyword}
                    onReorder={reorderKeywords}
                />

                {/* Add keyword input */}
                <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleKeywordInput}
                    placeholder="Add keyword and press Enter..."
                    className={cn(
                        "w-full px-3 py-2 rounded-md border bg-background text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                />
            </div>

            {/* Score */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Score</label>
                    <span className={cn("text-sm font-bold", getScoreColor(score))}>
                        {score}/100
                    </span>
                </div>
                <ScoreBar score={score} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !settings.apiKey}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors"
                    )}
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Regenerate'}
                </button>

                <button
                    onClick={handleCopyAll}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
                        "bg-secondary text-secondary-foreground",
                        "hover:bg-secondary/80 transition-colors"
                    )}
                >
                    <Copy className="w-4 h-4" />
                    Copy All
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving || (!editedTitle && !editedDescription && editedKeywords.length === 0)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
                        "bg-green-600 text-white",
                        "hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors"
                    )}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    )
}
