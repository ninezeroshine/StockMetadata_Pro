import OpenAI from 'openai'
import type { MetadataResult, Metadata } from '../../shared/types'
import { filterBlacklisted } from '../../shared/blacklist'
import {
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    KEYWORDS_MIN_COUNT,
    KEYWORDS_MAX_COUNT,
    REQUEST_TIMEOUT_MS
} from '../../shared/constants'

export class OpenRouterService {
    private client: OpenAI

    constructor(apiKey: string, model?: string) {
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey,
            timeout: REQUEST_TIMEOUT_MS,
            defaultHeaders: {
                'HTTP-Referer': 'https://stockmetadata.pro',
                'X-Title': 'StockMetadata Pro'
            }
        })
        this.model = model || 'google/gemini-2.0-flash-001'
    }

    private model: string

    async generateMetadata(imageBase64: string, systemPrompt: string): Promise<MetadataResult> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            max_tokens: 2048,
            temperature: 0.3,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                        }
                    ]
                }
            ]
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('Empty response from AI')
        }

        const parsed = JSON.parse(content) as Metadata
        const validated = this.validateAndClean(parsed)
        const score = this.calculateScore(validated)

        return { ...validated, score }
    }

    private validateAndClean(data: Metadata): Metadata {
        let { title, description, keywords } = data

        // Clean title
        title = title?.trim() || ''
        if (title.length > TITLE_MAX_LENGTH) {
            title = title.slice(0, TITLE_MAX_LENGTH)
        }

        // Clean description
        description = description?.trim() || ''
        if (description.length > DESCRIPTION_MAX_LENGTH) {
            description = description.slice(0, DESCRIPTION_MAX_LENGTH)
        }

        // Clean keywords
        keywords = keywords || []
        keywords = keywords
            .map(k => k.toLowerCase().trim())
            .filter(k => k.length > 0)

        // Remove duplicates
        keywords = [...new Set(keywords)]

        // Filter blacklisted
        keywords = filterBlacklisted(keywords)

        // Limit count
        if (keywords.length > KEYWORDS_MAX_COUNT) {
            keywords = keywords.slice(0, KEYWORDS_MAX_COUNT)
        }

        return { title, description, keywords }
    }

    private calculateScore(metadata: Metadata): number {
        let score = 0
        const { title, description, keywords } = metadata

        // Title scoring (max 30 points)
        const titleLen = title.length
        if (titleLen >= TITLE_MIN_LENGTH && titleLen <= TITLE_MAX_LENGTH) {
            score += 20
            if (titleLen >= 80 && titleLen <= 150) score += 10 // Optimal range
        } else if (titleLen >= 30) {
            score += 10
        }

        // Description scoring (max 30 points)
        const descLen = description.length
        if (descLen >= 100 && descLen <= 200) {
            score += 20
            if (descLen >= 120) score += 10
        } else if (descLen >= 50) {
            score += 10
        }

        // Keywords scoring (max 40 points)
        const kwCount = keywords.length
        if (kwCount >= 45) {
            score += 40
        } else if (kwCount >= KEYWORDS_MIN_COUNT) {
            score += 35
        } else if (kwCount >= 30) {
            score += 25
        } else {
            score += Math.floor(kwCount * 0.5)
        }

        return Math.min(100, score)
    }
}
