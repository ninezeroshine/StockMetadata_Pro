import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeywordListProps {
    keywords: string[]
    onRemove: (index: number) => void
    onReorder: (fromIndex: number, toIndex: number) => void
}

export function KeywordList({ keywords, onRemove, onReorder }: KeywordListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5 // Start drag after 5px movement
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = keywords.findIndex((_, i) => `keyword-${i}` === active.id)
            const newIndex = keywords.findIndex((_, i) => `keyword-${i}` === over.id)
            onReorder(oldIndex, newIndex)
        }
    }

    if (keywords.length === 0) {
        return (
            <div className="py-4 text-center text-muted-foreground text-sm">
                No keywords yet. Generate or add manually.
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={keywords.map((_, i) => `keyword-${i}`)}
                strategy={horizontalListSortingStrategy}
            >
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[80px]">
                    {keywords.map((keyword, index) => (
                        <SortableKeyword
                            key={`keyword-${index}`}
                            id={`keyword-${index}`}
                            keyword={keyword}
                            onRemove={() => onRemove(index)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

interface SortableKeywordProps {
    id: string
    keyword: string
    onRemove: () => void
}

function SortableKeyword({ id, keyword, onRemove }: SortableKeywordProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm",
                "bg-secondary text-secondary-foreground",
                "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50 shadow-lg z-10"
            )}
            {...attributes}
            {...listeners}
        >
            <span>{keyword}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    )
}
