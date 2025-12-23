import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings.store'
import { X, Eye, EyeOff, RotateCcw, FolderOpen } from 'lucide-react'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from '@shared/constants'
import type { AppSettings } from '@shared/types'

interface SettingsModalProps {
    open: boolean
    onClose: () => void
}

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Russian' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' }
] as const

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '14px',
    outline: 'none'
}

const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
    const { settings, updateSetting } = useSettingsStore()

    const [apiKey, setApiKey] = useState(settings.apiKey || '')
    const [model, setModel] = useState(settings.model || DEFAULT_MODEL)
    const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt || DEFAULT_SYSTEM_PROMPT)
    const [backupEnabled, setBackupEnabled] = useState(settings.backupEnabled ?? true)
    const [backupPath, setBackupPath] = useState(settings.backupPath || '')
    const [language, setLanguage] = useState<AppSettings['metadataLanguage']>(settings.metadataLanguage || 'en')
    const [showApiKey, setShowApiKey] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setApiKey(settings.apiKey || '')
        setModel(settings.model || DEFAULT_MODEL)
        setSystemPrompt(settings.systemPrompt || DEFAULT_SYSTEM_PROMPT)
        setBackupEnabled(settings.backupEnabled ?? true)
        setBackupPath(settings.backupPath || '')
        setLanguage(settings.metadataLanguage || 'en')
    }, [settings])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await Promise.all([
                updateSetting('apiKey', apiKey),
                updateSetting('model', model),
                updateSetting('systemPrompt', systemPrompt),
                updateSetting('backupEnabled', backupEnabled),
                updateSetting('backupPath', backupPath),
                updateSetting('metadataLanguage', language)
            ])
            onClose()
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleResetPrompt = () => {
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    }

    if (!open) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '600px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Settings</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '4px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    {/* API Configuration */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🔑 API Configuration
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500 }}>OpenRouter API Key</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '4px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6b7280'
                                    }}
                                >
                                    {showApiKey ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500 }}>AI Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder={DEFAULT_MODEL}
                                style={inputStyle}
                            />
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Default: {DEFAULT_MODEL}</p>
                        </div>
                    </section>

                    {/* System Prompt */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📝 System Prompt
                            </h3>
                            <button
                                onClick={handleResetPrompt}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                <RotateCcw style={{ width: '12px', height: '12px' }} />
                                Reset to Default
                            </button>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={8}
                            style={{
                                ...inputStyle,
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                resize: 'vertical'
                            }}
                        />
                    </section>

                    {/* Backup */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            💾 Backup
                        </h3>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={backupEnabled}
                                onChange={(e) => setBackupEnabled(e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '14px' }}>Create backup of original before writing metadata</span>
                        </label>

                        {backupEnabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 500 }}>Backup Folder (optional)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={backupPath}
                                        onChange={(e) => setBackupPath(e.target.value)}
                                        placeholder="Default: app data folder"
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e7eb',
                                        background: '#f3f4f6',
                                        cursor: 'pointer'
                                    }}>
                                        <FolderOpen style={{ width: '16px', height: '16px' }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Language */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🌐 Language
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500 }}>Metadata Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as AppSettings['metadataLanguage'])}
                                style={inputStyle}
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            ...buttonStyle,
                            background: 'transparent',
                            border: 'none',
                            color: '#374151'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            ...buttonStyle,
                            backgroundColor: '#171717',
                            color: '#ffffff',
                            border: 'none',
                            opacity: isSaving ? 0.5 : 1
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    )
}
