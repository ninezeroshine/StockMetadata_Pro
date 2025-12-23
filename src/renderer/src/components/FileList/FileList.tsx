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
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                color: '#6b7280',
                fontSize: '14px'
            }}>
                No files loaded
            </div>
        )
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
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
            <div style={{
                padding: '12px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* Batch Progress */}
                {isProcessingBatch && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '12px'
                    }}>
                        <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                        <span>Processing {batchProgress.current}/{batchProgress.total}</span>
                        <div style={{ flex: 1, height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                            <div
                                style={{
                                    height: '100%',
                                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                                    backgroundColor: '#22c55e',
                                    borderRadius: '2px',
                                    transition: 'width 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Generate All Button */}
                {pendingCount > 0 && (
                    <button
                        onClick={isProcessingBatch ? stopBatchProcessing : generateAllMetadata}
                        disabled={!hasApiKey && !isProcessingBatch}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isProcessingBatch ? '#ef4444' : '#22c55e',
                            color: '#ffffff',
                            cursor: hasApiKey || isProcessingBatch ? 'pointer' : 'not-allowed',
                            opacity: hasApiKey || isProcessingBatch ? 1 : 0.5,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isProcessingBatch ? (
                            <>
                                <Square style={{ width: '16px', height: '16px' }} />
                                Stop Processing
                            </>
                        ) : (
                            <>
                                <Sparkles style={{ width: '16px', height: '16px' }} />
                                Generate All ({pendingCount})
                            </>
                        )}
                    </button>
                )}

                {/* Clear All Button */}
                <button
                    onClick={clearAll}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
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
    const iconStyle = { width: '16px', height: '16px' }

    const statusIcon = {
        pending: <ImageIcon style={{ ...iconStyle, color: '#6b7280' }} />,
        processing: <Loader2 style={{ ...iconStyle, color: '#eab308', animation: 'spin 1s linear infinite' }} />,
        done: <CheckCircle2 style={{ ...iconStyle, color: '#22c55e' }} />,
        error: <XCircle style={{ ...iconStyle, color: '#ef4444' }} />
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
                backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 0.5)' }}
            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {file.preview ? (
                    <img
                        src={file.preview}
                        alt={file.fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <ImageIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                )}
            </div>

            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }} title={file.fileName}>
                    {truncate(file.fileName, 25)}
                </p>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '2px'
                }}>
                    {statusIcon}
                    <span style={{ textTransform: 'capitalize' }}>{file.status}</span>
                    {file.error && (
                        <span style={{ color: '#ef4444' }} title={file.error}>
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
                    color: '#6b7280',
                    cursor: 'pointer',
                    opacity: 0.5,
                    transition: 'opacity 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444' }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = '#6b7280' }}
            >
                <XCircle style={{ width: '16px', height: '16px' }} />
            </button>
        </div>
    )
}
