import { cn, getScoreHSL } from '@/lib/utils'

interface ScoreBarProps {
    score: number
}

export function ScoreBar({ score }: ScoreBarProps) {
    return (
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                    width: `${score}%`,
                    backgroundColor: getScoreHSL(score)
                }}
            />
        </div>
    )
}
