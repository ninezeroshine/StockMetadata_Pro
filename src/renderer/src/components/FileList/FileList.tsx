import type { FileItem } from '@shared/types'
import { truncate } from '@/lib/utils'
import { ImageIcon, Loader2, CheckCircle2, XCircle, Trash2, Sparkles, Square } from 'lucide-react'
import { useFilesStore } from '@/stores/files.store'
import { useSettingsStore } from '@/stores/settings.store'

interface FileListProps {
    files: FileItem[]
    selectedId: string | null
    onSelect: (id: string) => void
}

export function FileList({ files, selectedId, onSelect }: FileListProps) {
    const {
        removeFile,
        clearAll,
        generateAllMetadata,
        stopBatchProcessing,
        isProcessingBatch,
        batchProgress
    } = useFilesStore()
    const { settings } = useSettingsStore()

    const pendingCount = files.filter(f => f.status === 'pending').length
    const hasApiKey = !!settings.apiKey

    if (files.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 text-muted-foreground text-sm">
                No files loaded
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {files.map((file) => (
                    <FileListItem
                        key={file.id}
                        file={file}
                        isSelected={file.id === selectedId}
                        onClick={() => onSelect(file.id)}
                        onRemove={() => removeFile(file.id)}
                    />
                ))}
            </div>

            {/* Footer with Generate All and Clear All */}
            <div className="p-3 border-t border-border flex flex-col gap-2">
                {/* Batch Progress */}
                {isProcessingBatch && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing {batchProgress.current}/{batchProgress.total}</span>
                        <div className="flex-1 h-1 bg-border rounded-full">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Generate All Button */}
                {pendingCount > 0 && (
                    <button
                        onClick={isProcessingBatch ? stopBatchProcessing : generateAllMetadata}
                        disabled={!hasApiKey && !isProcessingBatch}
                        className={`
                            w-full flex items-center justify-center gap-2 py-2 px-3 
                            text-sm font-medium rounded-md border-none cursor-pointer
                            transition-all duration-200
                            ${isProcessingBatch
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'}
                            ${(!hasApiKey && !isProcessingBatch) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isProcessingBatch ? (
                            <>
                                <Square className="w-4 h-4" />
                                Stop Processing
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate All ({pendingCount})
                            </>
                        )}
                    </button>
                )}

                {/* Clear All Button */}
                <button
                    onClick={clearAll}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-sm rounded-md bg-transparent text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                </button>
            </div>
        </div>
    )
}

interface FileListItemProps {
    file: FileItem
    isSelected: boolean
    onClick: () => void
    onRemove: () => void
}

function FileListItem({ file, isSelected, onClick, onRemove }: FileListItemProps) {
    const statusIcon = {
        pending: <ImageIcon className="w-4 h-4 text-muted-foreground" />,
        processing: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
        done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        error: <XCircle className="w-4 h-4 text-destructive" />
    }[file.status]

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)'
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }
            }}
        >
            {/* Thumbnail */}
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                }}
            >
                {file.preview ? (
                    <img
                        src={file.preview}
                        alt={file.fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
            </div>

            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    className="text-foreground"
                    style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                    title={file.fileName}
                >
                    {truncate(file.fileName, 25)}
                </p>
                <div
                    className="text-muted-foreground"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        marginTop: '2px'
                    }}
                >
                    {statusIcon}
                    <span style={{ textTransform: 'capitalize' }}>{file.status}</span>
                    {file.error && (
                        <span className="text-destructive" title={file.error}>
                            - {truncate(file.error, 20)}
                        </span>
                    )}
                </div>
            </div>

            {/* Remove button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                style={{
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    opacity: 0.5,
                    transition: 'all 0.15s ease',
                    color: 'var(--muted-foreground)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.color = 'var(--destructive)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.5'
                    e.currentTarget.style.color = 'var(--muted-foreground)'
                }}
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    )
}
