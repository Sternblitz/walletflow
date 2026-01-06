/**
 * Google Wallet Integration
 * 
 * Unlike Apple Wallet which uses offline .pkpass files,
 * Google Wallet uses cloud-based objects via API.
 * 
 * Flow:
 * 1. Create a "Class" (template) once per campaign
 * 2. Create "Objects" (instances) for each customer
 * 3. Generate a signed JWT "Save to Google Wallet" link
 * 4. Updates are done via API mutation (no push needed)
 */

import { UniversalPassConfig, WalletService } from './types'
import { v4 as uuidv4 } from 'uuid'
import * as jwt from 'jsonwebtoken'

// ============================================
// TYPES
// ============================================

export interface GoogleServiceAccount {
    type: string
    project_id: string
    private_key_id: string
    private_key: string
    client_email: string
    client_id: string
    auth_uri: string
    token_uri: string
    auth_provider_x509_cert_url: string
    client_x509_cert_url: string
}

export interface GoogleLoyaltyClass {
    id: string                    // Format: issuerId.classId
    issuerName: string
    programName: string
    programLogo?: {
        sourceUri: { uri: string }
        contentDescription?: { defaultValue: { language: string; value: string } }
    }
    heroImage?: {
        sourceUri: { uri: string }
        contentDescription?: { defaultValue: { language: string; value: string } }
    }
    hexBackgroundColor?: string
    reviewStatus: 'UNDER_REVIEW' | 'APPROVED' | 'DRAFT'
    multipleDevicesAndHoldersAllowedStatus?: 'STATUS_UNSPECIFIED' | 'MULTIPLE_HOLDERS' | 'ONE_USER_ALL_DEVICES' | 'ONE_USER_ONE_DEVICE'
    accountNameLabel?: string
    accountIdLabel?: string
    // Localized strings
    localizedIssuerName?: { defaultValue: { language: string; value: string } }
    localizedProgramName?: { defaultValue: { language: string; value: string } }
    callbackOptions?: {
        url: string
        updateRequestUrl?: string
    }
    locations?: Array<{
        kind: 'walletobjects#latLongPoint',
        latitude: number,
        longitude: number
    }>
}

export interface GoogleLoyaltyObject {
    id: string                    // Format: issuerId.objectId
    classId: string               // Reference to the class
    state: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'INACTIVE'
    accountName?: string          // Customer name
    accountId?: string            // Customer ID / Serial number
    loyaltyPoints?: {
        label: string
        balance: { int?: number; double?: number; string?: string }
    }
    barcode?: {
        type: 'QR_CODE' | 'AZTEC' | 'TEXT_ONLY' | 'EAN_8' | 'EAN_13' | 'CODE_39' | 'CODE_128' | 'PDF_417' | 'DATA_MATRIX' | 'UPC_A'
        value: string
        alternateText?: string
    }
    textModulesData?: Array<{
        id?: string
        header: string
        body: string
    }>
    infoModuleData?: {
        showLastUpdateTime?: boolean
        labelValueRows?: Array<{
            columns: Array<{ label: string; value: string }>
        }>
    }
    // For stamp cards
    secondaryLoyaltyPoints?: {
        label: string
        balance: { int?: number }
    }
    linkedOfferIds?: string[]
    heroImage?: {
        sourceUri: { uri: string }
    }
    validTimeInterval?: {
        start: { date: string }
        end: { date: string }
    }
}

export interface GoogleWalletSaveLink {
    url: string
    jwt: string
}

// ============================================
// SERVICE
// ============================================

export class GoogleWalletService implements WalletService {
    private serviceAccount: GoogleServiceAccount | null = null
    private issuerId: string | null = null
    private accessToken: string | null = null
    private tokenExpiry: number = 0

    /**
     * Initialize service with credentials from environment
     */
    private getCredentials(): { serviceAccount: GoogleServiceAccount; issuerId: string } {
        if (this.serviceAccount && this.issuerId) {
            return { serviceAccount: this.serviceAccount, issuerId: this.issuerId }
        }

        const issuerId = process.env.GOOGLE_ISSUER_ID
        if (!issuerId) {
            throw new Error('GOOGLE_ISSUER_ID environment variable is required')
        }

        // Try base64 encoded service account (production)
        const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64
        if (serviceAccountBase64) {
            try {
                const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
                this.serviceAccount = JSON.parse(decoded)
                this.issuerId = issuerId
                console.log('[GOOGLE] Using BASE64 service account (production)')
                return { serviceAccount: this.serviceAccount!, issuerId }
            } catch (e) {
                throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_BASE64')
            }
        }

        // Try file path (local development)
        const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
        if (keyPath) {
            try {
                const fs = require('fs')
                const path = require('path')
                const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath)
                const content = fs.readFileSync(resolvedPath, 'utf-8')
                this.serviceAccount = JSON.parse(content)
                this.issuerId = issuerId
                console.log('[GOOGLE] Using file-based service account (local dev)')
                return { serviceAccount: this.serviceAccount!, issuerId }
            } catch {
                throw new Error(`Failed to load Google service account from: ${keyPath}`)
            }
        }

        throw new Error('Google Wallet credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY_PATH')
    }

    /**
     * Get OAuth2 access token for API calls
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken
        }

        const { serviceAccount } = this.getCredentials()

        // Create JWT for token exchange
        const now = Math.floor(Date.now() / 1000)
        const claim = {
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600, // 1 hour
        }

        const token = jwt.sign(claim, serviceAccount.private_key, { algorithm: 'RS256' })

        // Exchange JWT for access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: token,
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to get Google access token: ${error}`)
        }

        const data = await response.json()
        this.accessToken = data.access_token
        this.tokenExpiry = Date.now() + (data.expires_in * 1000)

        return this.accessToken!
    }

    /**
     * Create or update a loyalty class (template)
     */
    async createOrUpdateClass(classConfig: {
        classId: string
        programName: string
        issuerName: string
        logoUrl?: string
        heroImageUrl?: string
        backgroundColor?: string
        callbackUrl?: string
        locations?: Array<{ latitude: number; longitude: number }>
    }): Promise<GoogleLoyaltyClass> {
        const { serviceAccount, issuerId } = this.getCredentials()
        const accessToken = await this.getAccessToken()

        const fullClassId = `${issuerId}.${classConfig.classId}`

        const loyaltyClass: GoogleLoyaltyClass = {
            id: fullClassId,
            issuerName: classConfig.issuerName,
            programName: classConfig.programName,
            reviewStatus: 'UNDER_REVIEW',
            multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
            ...(classConfig.logoUrl && {
                programLogo: {
                    sourceUri: { uri: classConfig.logoUrl },
                    contentDescription: { defaultValue: { language: 'de', value: classConfig.programName } }
                }
            }),
            ...(classConfig.heroImageUrl && {
                heroImage: {
                    sourceUri: { uri: classConfig.heroImageUrl },
                    contentDescription: { defaultValue: { language: 'de', value: 'Banner' } }
                }
            }),
            ...(classConfig.backgroundColor && {
                hexBackgroundColor: classConfig.backgroundColor
            }),
            ...(classConfig.callbackUrl && {
                callbackOptions: {
                    url: classConfig.callbackUrl
                }
            }),
            ...(classConfig.locations && classConfig.locations.length > 0 && {
                locations: classConfig.locations.map(loc => ({
                    kind: 'walletobjects#latLongPoint',
                    latitude: loc.latitude,
                    longitude: loc.longitude
                }))
            })
        }

        // Try to get existing class first
        const getResponse = await fetch(
            `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${fullClassId}`,
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )

        if (getResponse.ok) {
            // Class exists, update it
            const updateResponse = await fetch(
                `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${fullClassId}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loyaltyClass),
                }
            )

            if (!updateResponse.ok) {
                const error = await updateResponse.text()
                throw new Error(`Failed to update Google Wallet class: ${error}`)
            }

            console.log(`[GOOGLE] Updated class: ${fullClassId}`)
            return await updateResponse.json()
        } else {
            // Class doesn't exist, create it
            const createResponse = await fetch(
                'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loyaltyClass),
                }
            )

            if (!createResponse.ok) {
                const error = await createResponse.text()
                throw new Error(`Failed to create Google Wallet class: ${error}`)
            }

            console.log(`[GOOGLE] Created class: ${fullClassId}`)
            return await createResponse.json()
        }
    }

    /**
     * Create a loyalty object (customer's pass instance)
     */
    async createObject(objectConfig: {
        objectId: string
        classId: string
        customerName?: string
        customerId: string
        stamps?: { current: number; max: number }
        points?: number
        barcodeValue: string
        textFields?: Array<{ header: string; body: string }>
    }): Promise<GoogleLoyaltyObject> {
        const { issuerId } = this.getCredentials()
        const accessToken = await this.getAccessToken()

        const fullObjectId = `${issuerId}.${objectConfig.objectId}`
        const fullClassId = `${issuerId}.${objectConfig.classId}`

        const loyaltyObject: GoogleLoyaltyObject = {
            id: fullObjectId,
            classId: fullClassId,
            state: 'ACTIVE',
            accountName: objectConfig.customerName || 'Stammkunde',
            accountId: objectConfig.customerId,
            barcode: {
                type: 'QR_CODE',
                value: objectConfig.barcodeValue,
                alternateText: objectConfig.customerId,
            },
            ...(objectConfig.stamps && {
                loyaltyPoints: {
                    label: 'Stempel',
                    balance: {
                        string: `${objectConfig.stamps.current}/${objectConfig.stamps.max}`
                    },
                },
            }),
            ...(objectConfig.points !== undefined && {
                loyaltyPoints: {
                    label: 'Punkte',
                    balance: { int: objectConfig.points },
                },
            }),
            ...(objectConfig.textFields && objectConfig.textFields.length > 0 && {
                textModulesData: objectConfig.textFields.map((field, i) => ({
                    id: `text_${i}`,
                    header: field.header,
                    body: field.body,
                })),
            }),
        }

        // Create the object via API
        const response = await fetch(
            'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loyaltyObject),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            // Check if object already exists
            if (response.status === 409) {
                console.log(`[GOOGLE] Object ${fullObjectId} already exists, updating...`)
                return this.updateObject(objectConfig.objectId, loyaltyObject)
            }
            throw new Error(`Failed to create Google Wallet object: ${error}`)
        }

        console.log(`[GOOGLE] Created object: ${fullObjectId}`)
        return await response.json()
    }

    /**
     * Update an existing loyalty object (e.g., when adding stamps)
     * @param objectId - The object ID to update
     * @param updates - The fields to update
     * @param notify - If true, triggers a push notification to the user (max 3/day)
     */
    async updateObject(
        objectId: string,
        updates: Partial<GoogleLoyaltyObject>,
        notify: boolean = false
    ): Promise<GoogleLoyaltyObject> {
        const { issuerId } = this.getCredentials()
        const accessToken = await this.getAccessToken()

        const fullObjectId = objectId.includes('.') ? objectId : `${issuerId}.${objectId}`

        // Add notifyPreference if notification is requested
        const requestBody: any = { ...updates }
        if (notify) {
            requestBody.notifyPreference = 'notifyOnUpdate'
        }

        const response = await fetch(
            `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${fullObjectId}`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to update Google Wallet object: ${error}`)
        }

        console.log(`[GOOGLE] Updated object: ${fullObjectId}${notify ? ' (with notification)' : ''}`)
        return await response.json()
    }

    /**
     * Send a custom push notification message to a user's pass
     * The message appears on the back of the pass and triggers a lock screen notification
     * 
     * @param objectId - The loyalty object ID
     * @param header - Short header text (e.g., "Sonderaktion!")
     * @param body - Main message body (e.g., "20% Rabatt nur heute!")
     * @param notify - If true (default), triggers push notification
     * 
     * Limits: Max 3 notifications per pass per 24 hours
     */
    async addMessage(
        objectId: string,
        header: string,
        body: string,
        notify: boolean = true
    ): Promise<GoogleLoyaltyObject> {
        const { issuerId } = this.getCredentials()
        const accessToken = await this.getAccessToken()

        const fullObjectId = objectId.includes('.') ? objectId : `${issuerId}.${objectId}`

        const message = {
            header,
            body,
            messageType: notify ? 'TEXT_AND_NOTIFY' : 'TEXT'
        }

        const response = await fetch(
            `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${fullObjectId}/addMessage`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to add message to Google Wallet object: ${error}`)
        }

        console.log(`[GOOGLE] Added message to ${fullObjectId}: "${header}" (notify: ${notify})`)
        return await response.json()
    }

    /**
     * Generate a "Save to Google Wallet" link (signed JWT)
     * This includes BOTH the class and object in the JWT so they are created together
     */
    generateSaveLink(objectConfig: {
        classId: string
        objectId: string
        customerName?: string
        customerId: string
        stamps?: { current: number; max: number }
        points?: number
        voucherValue?: string  // For COUPON: the main value like "20% Rabatt"
        barcodeValue: string
        textFields?: Array<{ header: string; body: string }>
        stampEmoji?: string  // Custom emoji for stamps
        // Class configuration (required for first-time creation)
        classConfig?: {
            programName: string
            issuerName: string
            logoUrl?: string
            heroImageUrl?: string
            backgroundColor?: string
            callbackUrl?: string
            locations?: Array<{ latitude: number; longitude: number }>
        }
    }): GoogleWalletSaveLink {
        const { serviceAccount, issuerId } = this.getCredentials()

        const fullObjectId = `${issuerId}.${objectConfig.objectId}`
        const fullClassId = `${issuerId}.${objectConfig.classId}`

        // Build the loyalty CLASS (template)
        const loyaltyClass: GoogleLoyaltyClass = {
            id: fullClassId,
            issuerName: objectConfig.classConfig?.issuerName || 'QARD',
            programName: objectConfig.classConfig?.programName || 'QARD Loyalty',
            reviewStatus: 'UNDER_REVIEW',
            multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
            programLogo: {
                sourceUri: {
                    uri: isValidUrl(objectConfig.classConfig?.logoUrl)
                        ? objectConfig.classConfig!.logoUrl!
                        : 'https://www.gstatic.com/images/branding/product/2x/google_wallet_512dp.png' // Fallback valid logo
                },
                contentDescription: {
                    defaultValue: {
                        language: 'de',
                        value: objectConfig.classConfig?.programName || 'QARD Loyalty'
                    }
                }
            },
            ...(isValidUrl(objectConfig.classConfig?.heroImageUrl) && {
                heroImage: {
                    sourceUri: { uri: objectConfig.classConfig!.heroImageUrl! },
                    contentDescription: { defaultValue: { language: 'de', value: 'Banner' } }
                }
            }),
            ...(objectConfig.classConfig?.backgroundColor && {
                hexBackgroundColor: objectConfig.classConfig.backgroundColor
            }),
            ...(objectConfig.classConfig?.callbackUrl && {
                callbackOptions: {
                    url: objectConfig.classConfig.callbackUrl
                }
            }),
            ...(objectConfig.classConfig?.locations && objectConfig.classConfig.locations.length > 0 && {
                locations: objectConfig.classConfig.locations.map(loc => ({
                    kind: 'walletobjects#latLongPoint',
                    latitude: loc.latitude,
                    longitude: loc.longitude
                }))
            })
        }

        // Generate visual stamp string (e.g. "☕ ☕ ⚪ ⚪")
        let stampVisual = ''
        if (objectConfig.stamps) {
            const filled = objectConfig.stamps.current
            const total = objectConfig.stamps.max
            // Use custom emoji from campaign config, or default to coffee
            const filledChar = objectConfig.stampEmoji || '☕'
            const emptyChar = '⚪'

            stampVisual = filledChar.repeat(filled) + ' ' + emptyChar.repeat(total - filled)
        }

        // Build the loyalty OBJECT (customer's pass instance)
        const loyaltyObject: GoogleLoyaltyObject = {
            id: fullObjectId,
            classId: fullClassId,
            state: 'ACTIVE',
            accountName: objectConfig.customerName || 'Stammkunde',
            accountId: objectConfig.customerId,
            barcode: {
                type: 'QR_CODE',
                value: objectConfig.barcodeValue,
                alternateText: objectConfig.customerId,
            },
            ...(objectConfig.stamps && {
                loyaltyPoints: {
                    label: 'Stempel',
                    balance: {
                        string: `${objectConfig.stamps.current}/${objectConfig.stamps.max}`
                    },
                },
            }),
            ...(objectConfig.points !== undefined && {
                loyaltyPoints: {
                    label: 'Punkte',
                    balance: { int: objectConfig.points },
                },
            }),
            // For COUPON: Show voucher value prominently
            ...(objectConfig.voucherValue && !objectConfig.stamps && objectConfig.points === undefined && {
                loyaltyPoints: {
                    label: 'GUTSCHEIN',
                    balance: {
                        string: objectConfig.voucherValue
                    },
                },
            }),
            textModulesData: [
                // Add the visual stamps as the first text module
                ...(stampVisual ? [{
                    id: 'visual_stamps',
                    header: 'Deine Karte',
                    body: stampVisual
                }] : []),
                // Add other text fields, but filter out any stamp-related duplicates
                ...(objectConfig.textFields?.filter(field => {
                    const headerLower = field.header.toLowerCase()
                    // Skip fields that would duplicate the stamp visual
                    return !headerLower.includes('fortschritt') &&
                        !headerLower.includes('progress') &&
                        !headerLower.includes('stempel') &&
                        !headerLower.includes('karte') &&
                        !headerLower.includes('stamps')
                }).map((field, i) => ({
                    id: `text_${i}`,
                    header: field.header,
                    body: field.body,
                })) || [])
            ],
        }

        // Create the JWT payload - include BOTH class and object
        const claims = {
            iss: serviceAccount.client_email,
            aud: 'google',
            origins: [process.env.NEXT_PUBLIC_BASE_URL || 'https://qard.io'],
            typ: 'savetowallet',
            payload: {
                loyaltyClasses: [loyaltyClass],  // Include class!
                loyaltyObjects: [loyaltyObject],
            },
        }

        // Sign the JWT
        const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' })

        return {
            url: `https://pay.google.com/gp/v/save/${token}`,
            jwt: token,
        }
    }

    /**
     * Update stamps for a Google Wallet pass
     * (Called after scan, instead of APNs push for Apple)
     * @param stampEmoji - The emoji to use for filled stamps (from campaign config)
     * @param preserveFields - Optional text fields to preserve (Prämie, Powered By etc.)
     */
    async updateStamps(
        objectId: string,
        stamps: { current: number; max: number },
        stampEmoji: string = '☕',
        preserveFields?: Array<{ id: string; header: string; body: string }>
    ): Promise<void> {
        // Generate visual stamp string (e.g. "☕ ☕ ⚪ ⚪")
        const filled = stamps.current
        const total = stamps.max
        const filledChar = stampEmoji
        const emptyChar = '⚪'
        const stampVisual = filledChar.repeat(filled) + ' ' + emptyChar.repeat(total - filled)

        // Build textModulesData: visual_stamps first, then preserved fields
        const textModulesData: Array<{ id: string; header: string; body: string }> = [
            {
                id: 'visual_stamps',
                header: 'Deine Karte',
                body: stampVisual
            }
        ]

        // Add preserved fields (if provided) - skip any that are stamp-related
        if (preserveFields) {
            preserveFields.forEach(field => {
                // Skip duplicate stamp fields
                if (field.id !== 'visual_stamps' &&
                    !field.header.toLowerCase().includes('fortschritt') &&
                    !field.header.toLowerCase().includes('progress')) {
                    textModulesData.push(field)
                }
            })
        }

        await this.updateObject(objectId, {
            loyaltyPoints: {
                label: 'Stempel',
                balance: {
                    string: `${stamps.current}/${stamps.max}`
                },
            },
            textModulesData
        }, true) // notify=true for push notification
    }

    /**
     * Update points for a Google Wallet pass
     */
    async updatePoints(objectId: string, points: number): Promise<void> {
        await this.updateObject(objectId, {
            loyaltyPoints: {
                label: 'Punkte',
                balance: { int: points },
            },
        }, true) // notify=true for push notification
    }

    /**
     * Void a voucher (mark as redeemed) in Google Wallet
     * Shows "EINGELÖST" status on the pass - changes main display
     */
    async voidVoucher(objectId: string, redeemedAt?: string): Promise<void> {
        const redeemDate = redeemedAt
            ? new Date(redeemedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

        await this.updateObject(objectId, {
            state: 'COMPLETED',  // Google Wallet state for completed/used passes
            // Update the main display field (loyaltyPoints becomes the primary visual)
            loyaltyPoints: {
                label: 'STATUS',
                balance: {
                    string: '✅ EINGELÖST'
                }
            },
            // Update text fields to show redemption info
            textModulesData: [
                {
                    id: 'redeemed_status',
                    header: 'GUTSCHEIN',
                    body: 'Wurde erfolgreich eingelöst'
                },
                {
                    id: 'redeemed_date',
                    header: 'Eingelöst am',
                    body: redeemDate
                }
            ]
        }, true) // notify=true for push notification

        console.log(`[GOOGLE] Voucher ${objectId} marked as COMPLETED/EINGELÖST`)
    }

    /**
     * Legacy interface implementation (for WalletBroker compatibility)
     * Returns the "Save to Google Wallet" link as a Buffer
     */
    async generatePass(config: UniversalPassConfig): Promise<Buffer> {
        // For Google Wallet, we generate a save link instead of a binary file
        const objectId = config.serialNumber || uuidv4()
        const classId = process.env.GOOGLE_WALLET_CLASS_ID || 'default_class'

        // Map config to Google format
        const textFields: Array<{ header: string; body: string }> = []

        if (config.secondaryFields) {
            config.secondaryFields.forEach(f => {
                textFields.push({ header: f.label, body: f.value })
            })
        }

        const saveLink = this.generateSaveLink({
            classId,
            objectId,
            customerId: objectId,
            barcodeValue: config.barcodeValue,
            textFields,
        })

        // Return the URL as a buffer (for compatibility with existing interface)
        return Buffer.from(JSON.stringify({
            type: 'google_wallet',
            saveUrl: saveLink.url,
            objectId: `${this.issuerId}.${objectId}`,
        }))
    }

    /**
     * Validates that Google Wallet is properly configured
     */
    static validateConfiguration(): { valid: boolean; error?: string } {
        try {
            const service = new GoogleWalletService()
            service.getCredentials()
            return { valid: true }
        } catch (error: any) {
            return { valid: false, error: error.message }
        }
    }
}

// Helper to validate URLs for Google Wallet
function isValidUrl(url: string | undefined): boolean {
    if (!url) return false
    try {
        const parsed = new URL(url)
        // Must be HTTPS and publicly accessible (no localhost)
        return parsed.protocol === 'https:' &&
            !parsed.hostname.includes('localhost') &&
            !parsed.hostname.includes('127.0.0.1') &&
            !parsed.hostname.includes('10.0.2.2')
    } catch {
        return false
    }
}
