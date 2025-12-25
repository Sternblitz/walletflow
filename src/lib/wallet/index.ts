/**
 * Universal Wallet Broker
 * 
 * Abstracts Apple Wallet and Google Wallet into a single interface.
 * The broker automatically handles platform-specific logic.
 */

import { AppleWalletService } from './apple'
import { GoogleWalletService } from './google'
import { UniversalPassConfig } from './types'

export type WalletPlatform = 'apple' | 'google'

export interface WalletGenerationResult {
    platform: WalletPlatform
    // For Apple: the .pkpass binary data
    // For Google: JSON with saveUrl
    data: Buffer
    // Additional metadata
    meta: {
        // Google-specific
        saveUrl?: string
        objectId?: string
        // Apple-specific
        serialNumber?: string
    }
}

export class WalletBroker {
    private appleService: AppleWalletService
    private googleService: GoogleWalletService

    constructor() {
        this.appleService = new AppleWalletService()
        this.googleService = new GoogleWalletService()
    }

    /**
     * Generate a pass for a specific platform
     */
    async generatePass(
        platform: WalletPlatform,
        config: UniversalPassConfig
    ): Promise<WalletGenerationResult> {
        if (platform === 'apple') {
            const data = await this.appleService.generatePass(config)
            return {
                platform: 'apple',
                data,
                meta: {
                    serialNumber: config.serialNumber,
                },
            }
        } else {
            const data = await this.googleService.generatePass(config)
            // Parse the JSON to extract metadata
            const parsed = JSON.parse(data.toString())
            return {
                platform: 'google',
                data,
                meta: {
                    saveUrl: parsed.saveUrl,
                    objectId: parsed.objectId,
                },
            }
        }
    }

    /**
     * Detect the platform from User-Agent and generate appropriate pass
     */
    async generatePassForUserAgent(
        userAgent: string,
        config: UniversalPassConfig
    ): Promise<WalletGenerationResult> {
        const platform = this.detectPlatform(userAgent)
        return this.generatePass(platform, config)
    }

    /**
     * Detect platform from User-Agent string
     */
    detectPlatform(userAgent: string): WalletPlatform {
        const ua = userAgent.toLowerCase()

        // iOS detection (iPhone, iPad, iPod)
        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
            return 'apple'
        }

        // macOS Safari (can add to Apple Wallet)
        if (ua.includes('macintosh') && ua.includes('safari') && !ua.includes('chrome')) {
            return 'apple'
        }

        // Everything else (Android, Windows, Linux) → Google Wallet
        return 'google'
    }

    /**
     * Update pass state (stamps, points, etc.)
     * Handles platform-specific update mechanisms
     */
    async updatePassState(
        passId: string,
        walletType: WalletPlatform,
        updates: {
            stamps?: { current: number; max: number }
            points?: number
        }
    ): Promise<void> {
        if (walletType === 'google') {
            // Google: Direct API mutation
            if (updates.stamps) {
                await this.googleService.updateStamps(passId, updates.stamps)
            }
            if (updates.points !== undefined) {
                await this.googleService.updatePoints(passId, updates.points)
            }
        } else {
            // Apple: Send APNs push (handled separately by apns.ts)
            // The actual update happens when the device requests the new pass
            const { sendPassUpdatePush } = await import('./apns')
            await sendPassUpdatePush(passId)
        }
    }

    /**
     * Get Google Wallet service for direct operations
     */
    getGoogleService(): GoogleWalletService {
        return this.googleService
    }

    /**
     * Get Apple Wallet service for direct operations
     */
    getAppleService(): AppleWalletService {
        return this.appleService
    }

    /**
     * Validate all wallet configurations
     */
    static validateAll(): {
        apple: { valid: boolean; error?: string }
        google: { valid: boolean; error?: string }
    } {
        return {
            apple: AppleWalletService.validateConfiguration(),
            google: GoogleWalletService.validateConfiguration(),
        }
    }
}

// Export singleton for convenience
let brokerInstance: WalletBroker | null = null

export function getWalletBroker(): WalletBroker {
    if (!brokerInstance) {
        brokerInstance = new WalletBroker()
    }
    return brokerInstance
}
