import { useCallback, useState, DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { SUPPORTED_EXTENSIONS } from '@shared/constants'

interface DropZoneProps {
    onDrop: (filePaths: string[]) => void
}

export function DropZone({ onDrop }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const files = Array.from(e.dataTransfer.files)
        console.log('Dropped files count:', files.length)

        const validPaths: string[] = []

        for (const file of files) {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase()
            if (!SUPPORTED_EXTENSIONS.includes(ext)) {
                console.log('Skipped unsupported file:', file.name)
                continue
            }

            try {
                // Use Electron's webUtils.getPathForFile via preload API
                const filePath = window.api.getPathForFile(file)
                if (filePath) {
                    validPaths.push(filePath)
                    console.log('Got file path:', filePath)
                } else {
                    console.warn('getPathForFile returned empty for:', file.name)
                }
            } catch (error) {
                console.error('Failed to get path for file:', file.name, error)
            }
        }

        if (validPaths.length > 0) {
            onDrop(validPaths)
        }
    }, [onDrop])

    // Handle click to open file dialog
    const handleClick = useCallback(async () => {
        try {
            const filePaths = await window.api.selectFiles()
            if (filePaths.length > 0) {
                onDrop(filePaths)
            }
        } catch (error) {
            console.error('Failed to select files:', error)
        }
    }, [onDrop])

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                margin: '12px',
                padding: '24px',
                border: '2px dashed',
                borderColor: isDragOver ? 'var(--primary)' : 'var(--border)',
                borderRadius: '8px',
                backgroundColor: isDragOver ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
                transition: 'all 0.2s ease'
            }}
        >
            <Upload
                style={{
                    width: '32px',
                    height: '32px',
                    color: isDragOver ? 'var(--primary)' : 'var(--muted-foreground)'
                }}
            />
            <div style={{ fontSize: '14px' }}>
                <p style={{
                    fontWeight: 500,
                    color: 'var(--foreground)',
                    margin: 0
                }}>
                    Drop files here
                </p>
                <p style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0'
                }}>
                    JPG, JPEG, PNG
                </p>
            </div>
        </div>
    )
}
