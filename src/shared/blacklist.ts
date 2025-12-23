// Blacklist words that should never appear in metadata
export const BLACKLIST_WORDS = [
    // Subjective words
    'beautiful', 'gorgeous', 'stunning', 'amazing', 'awesome',
    'perfect', 'best', 'nice', 'good', 'great', 'wonderful',
    'lovely', 'pretty', 'cute', 'fantastic', 'incredible',
    'magnificent', 'superb', 'excellent', 'outstanding',

    // Technical spam words
    '4k', '8k', 'hd', 'uhd', 'high quality', 'high resolution',
    'professional', 'stock photo', 'royalty free', 'royalty-free',
    'stock image', 'stock photography', 'commercial use',

    // Meaningless for search
    'wallpaper', 'background image', 'copy space', 'negative space',
    'horizontal', 'vertical', 'square', 'landscape', 'portrait',

    // Copyright terms
    'copyright', 'watermark', 'logo', 'trademark', 'registered',

    // Generic terms
    'image', 'photo', 'picture', 'photograph', 'shot', 'scene'
]

// Brand names blacklist
export const BLACKLIST_BRANDS = [
    // Tech brands
    'iphone', 'samsung', 'apple', 'google', 'microsoft', 'adobe',
    'android', 'windows', 'macos', 'ios', 'linux', 'chrome',
    'facebook', 'instagram', 'twitter', 'tiktok', 'youtube',
    'whatsapp', 'telegram', 'snapchat', 'linkedin', 'pinterest',
    'netflix', 'spotify', 'amazon', 'ebay', 'alibaba',

    // Camera brands
    'canon', 'nikon', 'sony', 'fujifilm', 'panasonic', 'olympus',
    'leica', 'hasselblad', 'gopro', 'dji',

    // Fashion brands
    'nike', 'adidas', 'puma', 'reebok', 'gucci', 'louis vuitton',
    'chanel', 'dior', 'prada', 'hermes', 'zara', 'h&m',

    // Automotive brands
    'mercedes', 'bmw', 'audi', 'volkswagen', 'toyota', 'honda',
    'ford', 'chevrolet', 'tesla', 'porsche', 'ferrari', 'lamborghini',

    // Food & beverage brands
    'coca-cola', 'pepsi', 'starbucks', 'mcdonalds', 'burger king',
    'kfc', 'subway', 'dominos', 'pizza hut', 'dunkin',

    // Other major brands
    'ikea', 'walmart', 'target', 'costco', 'home depot',
    'disney', 'marvel', 'dc comics', 'nintendo', 'playstation', 'xbox'
]

// Combined blacklist for quick lookup
export const FULL_BLACKLIST = new Set([
    ...BLACKLIST_WORDS.map(w => w.toLowerCase()),
    ...BLACKLIST_BRANDS.map(w => w.toLowerCase())
])

// Check if a word is blacklisted
export function isBlacklisted(word: string): boolean {
    return FULL_BLACKLIST.has(word.toLowerCase())
}

// Filter blacklisted words from array
export function filterBlacklisted(keywords: string[]): string[] {
    return keywords.filter(kw => !isBlacklisted(kw))
}
