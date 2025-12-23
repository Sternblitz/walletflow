import { createClient } from "@/lib/supabase/server"

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
        console.log(`[PUSH] No devices registered for pass ${pass.serial_number}`)
        return { success: true, sent: 0, errors: [] }
    }

    // Filter registrations with push tokens
    const tokensToNotify = registrations
        .filter(r => r.push_token)
        .map(r => r.push_token)

    if (tokensToNotify.length === 0) {
        console.log(`[PUSH] No push tokens available for pass ${pass.serial_number}`)
        return { success: true, sent: 0, errors: [] }
    }

    const errors: string[] = []
    let sent = 0

    // Check for base64 certs (production) or skip push
    const certBase64 = process.env.APPLE_SIGNER_CERT_BASE64
    const keyBase64 = process.env.APPLE_SIGNER_KEY_BASE64
    const keyPassphrase = process.env.APPLE_SIGNER_KEY_PASSPHRASE
    const passTypeId = process.env.APPLE_PASS_TYPE_ID

    // Detailed config check
    const missingConfig: string[] = []
    if (!certBase64) missingConfig.push('APPLE_SIGNER_CERT_BASE64')
    if (!keyBase64) missingConfig.push('APPLE_SIGNER_KEY_BASE64')
    if (!keyPassphrase) missingConfig.push('APPLE_SIGNER_KEY_PASSPHRASE')
    if (!passTypeId) missingConfig.push('APPLE_PASS_TYPE_ID')

    if (missingConfig.length > 0) {
        console.log(`[PUSH] APNs not configured - missing: ${missingConfig.join(', ')}`)
        return { success: true, sent: 0, errors: [`APNs not configured (missing: ${missingConfig.join(', ')})`] }
    }

    try {
        // Dynamic import to avoid issues in edge runtime
        const apn = await import('apn')

        // Create APN provider with certificate (values validated above)
        const provider = new apn.Provider({
            cert: Buffer.from(certBase64!, 'base64'),
            key: Buffer.from(keyBase64!, 'base64'),
            passphrase: keyPassphrase!,
            production: true, // Wallet passes always use production
        })

        // Send push to each device
        for (const token of tokensToNotify) {
            try {
                // Wallet pass push notification is a simple empty payload
                const notification = new apn.Notification()
                notification.payload = {} // Empty payload for Wallet updates
                notification.topic = passTypeId! // Pass Type ID is the topic

                const result = await provider.send(notification, token)

                if (result.failed.length > 0) {
                    errors.push(`Token ${token.substring(0, 8)}...: ${result.failed[0].response?.reason || 'Unknown error'}`)
                } else {
                    sent++
                }
            } catch (e: any) {
                errors.push(`Token ${token.substring(0, 8)}...: ${e.message}`)
            }
        }

        provider.shutdown()

    } catch (e: any) {
        errors.push(`APNs error: ${e.message}`)
    }

    console.log(`[PUSH] Sent ${sent}/${tokensToNotify.length} notifications for pass ${pass.serial_number}`)

    return { success: sent > 0 || errors.length === 0, sent, errors }
}
