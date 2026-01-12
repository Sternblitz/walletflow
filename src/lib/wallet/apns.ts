import { createClient } from "@/lib/supabase/server"

/**
 * Apple Push Notification Service (APNs) Module
 * 
 * CRITICAL: Uses Singleton pattern for the APN Provider to ensure
 * connection reuse and reliability. Creating a new provider per request
 * was causing connection issues.
 */

// ============================================
// SINGLETON PROVIDER
// ============================================

let _apnModule: any = null
let _apnProvider: any = null
let _providerConfig: { cert: Buffer; key: Buffer; passphrase: string } | null = null

/**
 * Get or create the singleton APN Provider
 * Reuses the same provider instance across all requests
 */
async function getApnProvider(): Promise<any> {
    // Check if already initialized and valid
    if (_apnProvider && _providerConfig) {
        return _apnProvider
    }

    // Load configuration
    const certBase64 = process.env.APPLE_SIGNER_CERT_BASE64
    const keyBase64 = process.env.APPLE_SIGNER_KEY_BASE64
    const keyPassphrase = process.env.APPLE_SIGNER_KEY_PASSPHRASE

    if (!certBase64 || !keyBase64 || !keyPassphrase) {
        throw new Error('APNs not configured: missing APPLE_SIGNER_CERT_BASE64, APPLE_SIGNER_KEY_BASE64, or APPLE_SIGNER_KEY_PASSPHRASE')
    }

    // Lazy load apn module
    if (!_apnModule) {
        _apnModule = await import('apn')
    }

    // Create provider config
    _providerConfig = {
        cert: Buffer.from(certBase64, 'base64'),
        key: Buffer.from(keyBase64, 'base64'),
        passphrase: keyPassphrase
    }

    // Create singleton provider
    _apnProvider = new _apnModule.Provider({
        cert: _providerConfig.cert,
        key: _providerConfig.key,
        passphrase: _providerConfig.passphrase,
        production: true, // Wallet passes always use production
    })

    console.log('[APNS] Singleton provider initialized')
    return _apnProvider
}

/**
 * Check if APNs is properly configured
 */
export function isApnsConfigured(): { configured: boolean; missing: string[] } {
    const missing: string[] = []
    if (!process.env.APPLE_SIGNER_CERT_BASE64) missing.push('APPLE_SIGNER_CERT_BASE64')
    if (!process.env.APPLE_SIGNER_KEY_BASE64) missing.push('APPLE_SIGNER_KEY_BASE64')
    if (!process.env.APPLE_SIGNER_KEY_PASSPHRASE) missing.push('APPLE_SIGNER_KEY_PASSPHRASE')
    if (!process.env.APPLE_PASS_TYPE_ID) missing.push('APPLE_PASS_TYPE_ID')

    return { configured: missing.length === 0, missing }
}

/**
 * Send APNs push notification to update a Wallet pass
 * 
 * When a pass is updated (e.g., stamp added), this function
 * sends a silent push to all registered devices, telling them
 * to fetch the updated pass from our web service.
 */
export async function sendPassUpdatePush(passId: string): Promise<{ success: boolean; sent: number; errors: string[] }> {
    const supabase = await createClient()

    // Get the pass with its serial number
    const { data: pass, error: passError } = await supabase
        .from('passes')
        .select('serial_number')
        .eq('id', passId)
        .single()

    if (passError || !pass) {
        return { success: false, sent: 0, errors: ['Pass not found'] }
    }

    // Get all registered devices for this pass
    const { data: registrations, error: regError } = await supabase
        .from('device_registrations')
        .select('push_token, device_library_identifier')
        .eq('serial_number', pass.serial_number)

    if (regError) {
        return { success: false, sent: 0, errors: [regError.message] }
    }

    if (!registrations || registrations.length === 0) {
        console.log(`[APNS] No devices registered for pass ${pass.serial_number}`)
        return { success: true, sent: 0, errors: ['No devices registered'] }
    }

    // Filter registrations with push tokens
    const tokensToNotify = registrations
        .filter(r => r.push_token)
        .map(r => r.push_token)

    if (tokensToNotify.length === 0) {
        return { success: true, sent: 0, errors: ['No push tokens available'] }
    }

    // Check configuration
    const config = isApnsConfigured()
    if (!config.configured) {
        console.log(`[APNS] Not configured - missing: ${config.missing.join(', ')}`)
        return { success: true, sent: 0, errors: [`APNs not configured (missing: ${config.missing.join(', ')})`] }
    }

    const passTypeId = process.env.APPLE_PASS_TYPE_ID!
    const errors: string[] = []
    let sent = 0

    try {
        // Get singleton provider
        const provider = await getApnProvider()
        const apn = _apnModule

        // Send push to each device
        for (const token of tokensToNotify) {
            try {
                // Wallet pass push notification is a simple empty payload
                const notification = new apn.Notification()
                notification.payload = {} // Empty payload for Wallet updates
                notification.topic = passTypeId // Pass Type ID is the topic

                const result = await provider.send(notification, token)

                if (result.failed.length > 0) {
                    const reason = result.failed[0].response?.reason || 'Unknown error'
                    errors.push(`Token ${token.substring(0, 8)}...: ${reason}`)

                    // Handle invalid tokens - could clean up from DB
                    if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
                        console.log(`[APNS] Invalid token detected: ${token.substring(0, 8)}...`)
                        // TODO: Remove invalid tokens from device_registrations
                    }
                } else {
                    sent++
                }
            } catch (e: any) {
                errors.push(`Token ${token.substring(0, 8)}...: ${e.message}`)
            }
        }

        // NOTE: We do NOT shutdown the provider anymore - it's a singleton!

    } catch (e: any) {
        errors.push(`APNs error: ${e.message}`)
        console.error('[APNS] Provider error:', e)
    }

    console.log(`[APNS] Sent ${sent}/${tokensToNotify.length} notifications for pass ${pass.serial_number}`)

    return { success: sent > 0 || errors.length === 0, sent, errors }
}

/**
 * Send push to multiple passes efficiently
 * Uses batching for better performance
 */
export async function sendBatchPush(passIds: string[]): Promise<{ sent: number; failed: number; errors: string[] }> {
    let totalSent = 0
    let totalFailed = 0
    const allErrors: string[] = []

    // Process in batches of 20
    const batchSize = 20
    for (let i = 0; i < passIds.length; i += batchSize) {
        const batch = passIds.slice(i, i + batchSize)

        const results = await Promise.all(
            batch.map(passId => sendPassUpdatePush(passId))
        )

        for (const result of results) {
            totalSent += result.sent
            if (!result.success) {
                totalFailed++
            }
            allErrors.push(...result.errors)
        }
    }

    return { sent: totalSent, failed: totalFailed, errors: allErrors }
}

