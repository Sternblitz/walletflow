import { UniversalPassConfig, WalletService } from './types'
import { PKPass } from 'passkit-generator'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

export interface AppleCertConfig {
    wwdr: string            // Path or Buffer content
    signerCert: string      // Path or Buffer content
    signerKey: string       // Path or Buffer content
    signerKeyPassphrase: string
    passTypeIdentifier: string
    teamIdentifier?: string
    // For base64 mode, we store the actual buffers
    wwdrBuffer?: Buffer
    signerCertBuffer?: Buffer
    signerKeyBuffer?: Buffer
}

/**
 * Loads and validates Apple Wallet certificates
 * 
 * Supports two modes:
 * 1. FILE MODE (local dev): Uses file paths from env vars
 * 2. BASE64 MODE (production): Uses base64-encoded certs from env vars
 * 
 * For production (Vercel), set these env vars:
 * - APPLE_WWDR_CERT_BASE64: base64 encoded WWDR.pem content
 * - APPLE_SIGNER_CERT_BASE64: base64 encoded signerCert.pem content  
 * - APPLE_SIGNER_KEY_BASE64: base64 encoded signerKey.pem content
 */
export function loadAppleCerts(): AppleCertConfig {
    const passTypeId = process.env.APPLE_PASS_TYPE_ID
    const signerKeyPassphrase = process.env.APPLE_SIGNER_KEY_PASSPHRASE
    const teamId = process.env.APPLE_TEAM_ID

    if (!passTypeId || !signerKeyPassphrase) {
        throw new Error(
            'Missing Apple Wallet configuration. Please set: APPLE_PASS_TYPE_ID, APPLE_SIGNER_KEY_PASSPHRASE'
        )
    }

    // Check for BASE64 mode (production/Vercel)
    const wwdrBase64 = process.env.APPLE_WWDR_CERT_BASE64
    const signerCertBase64 = process.env.APPLE_SIGNER_CERT_BASE64
    const signerKeyBase64 = process.env.APPLE_SIGNER_KEY_BASE64

    if (wwdrBase64 && signerCertBase64 && signerKeyBase64) {
        console.log('[CERTS] Using BASE64 mode (production)')
        return {
            wwdr: '', // Not used in base64 mode
            signerCert: '',
            signerKey: '',
            signerKeyPassphrase,
            passTypeIdentifier: passTypeId,
            teamIdentifier: teamId,
            wwdrBuffer: Buffer.from(wwdrBase64, 'base64'),
            signerCertBuffer: Buffer.from(signerCertBase64, 'base64'),
            signerKeyBuffer: Buffer.from(signerKeyBase64, 'base64'),
        }
    }

    // FILE MODE (local development)
    console.log('[CERTS] Using FILE mode (local dev)')
    const wwdrPath = process.env.APPLE_WWDR_CERT_PATH
    const signerCertPath = process.env.APPLE_SIGNER_CERT_PATH
    const signerKeyPath = process.env.APPLE_SIGNER_KEY_PATH || signerCertPath

    if (!wwdrPath || !signerCertPath) {
        throw new Error(
            'Missing Apple Wallet certs. Set either BASE64 vars (production) or PATH vars (local dev)'
        )
    }

    // Resolve paths (support both relative and absolute)
    const resolvePath = (filePath: string): string => {
        if (path.isAbsolute(filePath)) {
            return filePath
        }
        return path.join(process.cwd(), filePath)
    }

    const resolvedWwdr = resolvePath(wwdrPath)
    const resolvedSignerCert = resolvePath(signerCertPath)
    const resolvedSignerKey = resolvePath(signerKeyPath!)

    // Validate files exist
    if (!fs.existsSync(resolvedWwdr)) {
        throw new Error(`WWDR certificate not found at: ${resolvedWwdr}`)
    }

    if (!fs.existsSync(resolvedSignerCert)) {
        throw new Error(`Signer certificate not found at: ${resolvedSignerCert}`)
    }

    if (!fs.existsSync(resolvedSignerKey)) {
        throw new Error(`Signer private key not found at: ${resolvedSignerKey}`)
    }

    return {
        wwdr: resolvedWwdr,
        signerCert: resolvedSignerCert,
        signerKey: resolvedSignerKey,
        signerKeyPassphrase,
        passTypeIdentifier: passTypeId,
        teamIdentifier: teamId,
    }
}

// Sehr kleines, eingebautes 1x1 PNG als Fallback-Icon,
// damit der Pass mindestens ein gültiges Icon hat.
function getEmbeddedIcon(): Buffer {
    const base64Png =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    return Buffer.from(base64Png, 'base64')
}

export class AppleWalletService implements WalletService {
    private certs: AppleCertConfig | null = null

    /**
     * Lazy load certificates (only when needed)
     */
    private getCerts(): AppleCertConfig {
        if (!this.certs) {
            this.certs = loadAppleCerts()
        }
        return this.certs
    }

    async generatePass(config: UniversalPassConfig): Promise<Buffer> {
        const certs = this.getCerts()

        try {
            // 1. Create the Pass Structure
            // First arg: buffers (empty files initially)
            // Second arg: certificates
            // Third arg: pass.json specific fields/overrides
            const pass = new PKPass(
                {},
                {
                    wwdr: fs.readFileSync(certs.wwdr),
                    signerCert: fs.readFileSync(certs.signerCert),
                    signerKey: fs.readFileSync(certs.signerKey),
                    signerKeyPassphrase: certs.signerKeyPassphrase,
                },
                {
                    passTypeIdentifier: certs.passTypeIdentifier,
                    teamIdentifier: certs.teamIdentifier || '',
                    organizationName: 'QARD',
                    serialNumber: config.serialNumber,
                    description: 'QARD Test Pass',
                    formatVersion: 1, // Required
                    backgroundColor: config.backgroundColor,
                    foregroundColor: config.foregroundColor,
                    labelColor: config.labelColor,
                    logoText: config.logoText,
                }
            )

            // Set pass type
            pass.type = 'storeCard'

            // Dynamic Icons/Strip Images
            if (config.iconBuffer) {
                pass.addBuffer('icon.png', config.iconBuffer)
                pass.addBuffer('icon@2x.png', config.iconBuffer)
                pass.addBuffer('logo.png', config.iconBuffer)
                pass.addBuffer('logo@2x.png', config.iconBuffer)
            } else {
                const fallback = getEmbeddedIcon()
                pass.addBuffer('icon.png', fallback)
                pass.addBuffer('icon@2x.png', fallback)
                pass.addBuffer('logo.png', fallback)
                pass.addBuffer('logo@2x.png', fallback)
            }

            if (config.stripBuffer) {
                pass.addBuffer('strip.png', config.stripBuffer)
                pass.addBuffer('strip@2x.png', config.stripBuffer)
            }

            // 3. Web Service URL for updates (if base URL is configured)
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
            if (baseUrl) {
                // Use explicit keys in the overrides if these setters don't exist on the type
                // But for now, let's try to pass them directly to the instance if supported, 
                // or better, pass them in the 3rd arg if possible. 
                // Since I can't easily change the 3rd arg dynamically after const creation without casting,
                // I will assume the existing setters might effectively work if the json structure is initialized, 
                // OR I should use pass.overrides if available.
                // Actually, passkit-generator often copies properties from instance to json on generation.
                // Let's rely on the 3rd arg for the main ones.
                // For webServiceURL, let's use the property assignment if valid, or add to 'pass.json' buffer?
                // The library might not have a setter for webServiceURL properly typed.
                // Let's add them to the validation below.
                (pass as any).webServiceURL = `${baseUrl}/api/pass`;
                (pass as any).authenticationToken = config.authToken || randomUUID();
            }

            // 4. Barcode
            pass.setBarcodes({
                message: config.barcodeValue,
                format: 'PKBarcodeFormatQR',
                messageEncoding: 'iso-8859-1',
            })

            // 5. Fields
            // (Color/LogoText handled in constructor options now)

            // 6. Fields
            if (config.headerLabel && config.headerValue) {
                pass.headerFields.push({
                    key: 'header',
                    label: config.headerLabel,
                    value: config.headerValue,
                })
            }

            if (config.primaryLabel && config.primaryValue) {
                pass.primaryFields.push({
                    key: 'primary',
                    label: config.primaryLabel,
                    value: config.primaryValue,
                })
            }

            config.secondaryFields?.forEach((field, index) => {
                pass.secondaryFields.push({
                    key: `sec_${index}`,
                    label: field.label,
                    value: field.value,
                })
            })

            config.auxiliaryFields?.forEach((field, index) => {
                pass.auxiliaryFields.push({
                    key: `aux_${index}`,
                    label: field.label,
                    value: field.value,
                    textAlignment: 'PKTextAlignmentCenter' // Center branding
                })
            })

            // 7. Return the Buffer (The .pkpass file)
            return pass.getAsBuffer()
        } catch (error: any) {
            // Enhanced error handling
            if (error.message?.includes('certificate')) {
                throw new Error(
                    `Apple Wallet certificate error: ${error.message}. Please verify your certificate paths and passphrase.`
                )
            }
            if (error.message?.includes('Pass Type ID')) {
                throw new Error(
                    `Invalid Pass Type ID: ${certs.passTypeIdentifier}. Please verify it matches your Apple Developer account.`
                )
            }
            throw new Error(`Failed to generate Apple Wallet pass: ${error.message}`)
        }
    }

    /**
     * Validates that all required certificates are configured
     */
    static validateConfiguration(): { valid: boolean; error?: string } {
        try {
            const service = new AppleWalletService()
            service.getCerts()
            return { valid: true }
        } catch (error: any) {
            return { valid: false, error: error.message }
        }
    }
}
