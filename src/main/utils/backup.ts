import { app } from 'electron'
import { copyFile, mkdir } from 'fs/promises'
import { join, basename, dirname } from 'path'
import { existsSync } from 'fs'

/**
 * Create a backup of the original file before writing metadata
 */
export async function createBackupFile(filePath: string, customBackupPath?: string): Promise<string> {
    const backupDir = customBackupPath || join(app.getPath('userData'), 'backups')

    // Ensure backup directory exists
    if (!existsSync(backupDir)) {
        await mkdir(backupDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileName = basename(filePath)
    const backupFileName = `${timestamp}_${fileName}`
    const backupPath = join(backupDir, backupFileName)

    await copyFile(filePath, backupPath)

    return backupPath
}

/**
 * Get the default backup directory path
 */
export function getDefaultBackupPath(): string {
    return join(app.getPath('userData'), 'backups')
}
