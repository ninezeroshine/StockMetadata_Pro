import { useState, useMemo } from 'react'
import type { RawMetadata, TechnicalMetadata } from '@shared/types'
import { cn } from '@/lib/utils'
import { X, Search, Trash2, AlertTriangle, Camera, FileText, Tag, Info, ChevronDown, ChevronRight } from 'lucide-react'

interface MetadataViewerProps {
    open: boolean
    onClose: () => void
    metadata: RawMetadata | undefined
    fileName: string
    onDeleteTags: (tags: string[]) => void
    onDeleteAll: () => void
}

// Category display configuration
const CATEGORIES = {
    stock: { label: 'Stock Metadata', icon: Tag, color: 'text-green-500' },
    technical: { label: 'Technical Info', icon: Camera, color: 'text-blue-500' },
    other: { label: 'Other Tags', icon: FileText, color: 'text-muted-foreground' }
} as const

// Human-readable labels for technical fields
const TECHNICAL_LABELS: Record<keyof TechnicalMetadata, string> = {
    make: 'Camera Make',
    model: 'Camera Model',
    lensModel: 'Lens',
    iso: 'ISO',
    fNumber: 'Aperture (f/)',
    exposureTime: 'Shutter Speed',
    focalLength: 'Focal Length',
    imageWidth: 'Width (px)',
    imageHeight: 'Height (px)',
    dateTimeOriginal: 'Date Taken',
    createDate: 'Created',
    modifyDate: 'Modified',
    gpsLatitude: 'GPS Latitude',
    gpsLongitude: 'GPS Longitude',
    gpsAltitude: 'GPS Altitude (m)',
    fileSize: 'File Size',
    fileType: 'File Type',
    mimeType: 'MIME Type'
}

export function MetadataViewer({
    open,
    onClose,
    metadata,
    fileName,
    onDeleteTags,
    onDeleteAll
}: MetadataViewerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['stock', 'technical']))
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Toggle section expansion
    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(section)) {
                next.delete(section)
            } else {
                next.add(section)
            }
            return next
        })
    }

    // Toggle tag selection
    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            const next = new Set(prev)
            if (next.has(tag)) {
                next.delete(tag)
            } else {
                next.add(tag)
            }
            return next
        })
    }

    // Filter tags by search query
    const filteredOtherTags = useMemo(() => {
        if (!metadata?.other) return []
        const entries = Object.entries(metadata.other)
        if (!searchQuery) return entries

        const query = searchQuery.toLowerCase()
        return entries.filter(([key, value]) =>
            key.toLowerCase().includes(query) ||
            String(value).toLowerCase().includes(query)
        )
    }, [metadata?.other, searchQuery])

    // Handle delete selected
    const handleDeleteSelected = () => {
        if (selectedTags.size === 0) return
        onDeleteTags(Array.from(selectedTags))
        setSelectedTags(new Set())
    }

    // Handle delete all
    const handleDeleteAll = () => {
        setShowDeleteConfirm(false)
        onDeleteAll()
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[85vh] m-4 rounded-xl overflow-hidden flex flex-col bg-popover border border-border shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Metadata Viewer</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{fileName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tags..."
                            className={cn(
                                "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
                                "bg-muted border border-input text-foreground",
                                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            )}
                        />
                    </div>

                    {selectedTags.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                                "bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                            )}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedTags.size})
                        </button>
                    )}

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                            "bg-muted text-muted-foreground hover:bg-accent transition-colors"
                        )}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete All
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {!metadata ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Info className="w-12 h-12 mb-4 opacity-50" />
                            <p>No metadata available</p>
                        </div>
                    ) : (
                        <>
                            {/* Stock Metadata Section */}
                            <MetadataSection
                                id="stock"
                                label={CATEGORIES.stock.label}
                                icon={CATEGORIES.stock.icon}
                                iconColor={CATEGORIES.stock.color}
                                expanded={expandedSections.has('stock')}
                                onToggle={() => toggleSection('stock')}
                            >
                                <div className="space-y-3">
                                    <MetadataField
                                        label="Title"
                                        value={metadata.stock.title}
                                        selectable
                                        selected={selectedTags.has('Title')}
                                        onSelect={() => toggleTag('Title')}
                                    />
                                    <MetadataField
                                        label="Description"
                                        value={metadata.stock.description}
                                        selectable
                                        selected={selectedTags.has('Description')}
                                        onSelect={() => toggleTag('Description')}
                                    />
                                    <MetadataField
                                        label="Keywords"
                                        value={metadata.stock.keywords.join(', ')}
                                        selectable
                                        selected={selectedTags.has('Keywords')}
                                        onSelect={() => toggleTag('Keywords')}
                                    />
                                </div>
                            </MetadataSection>

                            {/* Technical Metadata Section */}
                            <MetadataSection
                                id="technical"
                                label={CATEGORIES.technical.label}
                                icon={CATEGORIES.technical.icon}
                                iconColor={CATEGORIES.technical.color}
                                expanded={expandedSections.has('technical')}
                                onToggle={() => toggleSection('technical')}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(metadata.technical).map(([key, value]) => {
                                        if (value === undefined || value === null) return null
                                        const label = TECHNICAL_LABELS[key as keyof TechnicalMetadata] || key
                                        return (
                                            <MetadataField
                                                key={key}
                                                label={label}
                                                value={String(value)}
                                                compact
                                            />
                                        )
                                    })}
                                </div>
                            </MetadataSection>

                            {/* Other Tags Section */}
                            {filteredOtherTags.length > 0 && (
                                <MetadataSection
                                    id="other"
                                    label={`${CATEGORIES.other.label} (${filteredOtherTags.length})`}
                                    icon={CATEGORIES.other.icon}
                                    iconColor={CATEGORIES.other.color}
                                    expanded={expandedSections.has('other')}
                                    onToggle={() => toggleSection('other')}
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredOtherTags.map(([key, value]) => (
                                            <MetadataField
                                                key={key}
                                                label={key}
                                                value={formatValue(value)}
                                                compact
                                                selectable
                                                selected={selectedTags.has(key)}
                                                onSelect={() => toggleTag(key)}
                                            />
                                        ))}
                                    </div>
                                </MetadataSection>
                            )}

                            {/* Tag Count */}
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Total tags in file: {metadata.tagCount}
                            </div>
                        </>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="p-6 rounded-xl max-w-md bg-popover border border-border shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                                <h3 className="text-lg font-semibold text-foreground">Delete All Metadata?</h3>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                This will permanently remove ALL metadata from the file.
                                A backup will be created first. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                                >
                                    Delete All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface MetadataSectionProps {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
    expanded: boolean
    onToggle: () => void
    children: React.ReactNode
}

function MetadataSection({
    label,
    icon: Icon,
    iconColor,
    expanded,
    onToggle,
    children
}: MetadataSectionProps) {
    return (
        <div className="rounded-lg overflow-hidden bg-muted/50 border border-border">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Icon className={cn("w-5 h-5", iconColor)} />
                <span className="font-medium text-foreground">{label}</span>
            </button>

            {expanded && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    )
}

interface MetadataFieldProps {
    label: string
    value: string
    compact?: boolean
    selectable?: boolean
    selected?: boolean
    onSelect?: () => void
}

function MetadataField({
    label,
    value,
    compact,
    selectable,
    selected,
    onSelect
}: MetadataFieldProps) {
    if (!value) {
        return null
    }

    return (
        <div
            className={cn(
                "rounded-lg bg-background border border-border",
                compact ? "p-2" : "p-3",
                selectable && "cursor-pointer hover:ring-2 hover:ring-ring/50",
                selected && "ring-2 ring-primary bg-primary/10"
            )}
            onClick={selectable ? onSelect : undefined}
        >
            <div className={cn(
                "text-muted-foreground mb-1",
                compact ? "text-xs" : "text-xs"
            )}>
                {label}
            </div>
            <div className={cn(
                "text-foreground break-words",
                compact ? "text-sm" : "text-sm"
            )}>
                {value || <span className="text-muted-foreground italic">Empty</span>}
            </div>
        </div>
    )
}

// Format complex values for display
function formatValue(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value)
        } catch {
            return String(value)
        }
    }
    return String(value)
}
