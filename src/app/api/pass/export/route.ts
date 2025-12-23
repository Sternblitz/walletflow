/**
 * Slot-Based Pass Export API
 * 
 * POST /api/pass/export
 * 
 * Accepts a WalletPassDraft and returns a signed .pkpass file
 */

import { NextRequest, NextResponse } from 'next/server'
import { WalletPassDraft } from '@/lib/wallet/types'
import { validateDraft } from '@/lib/wallet/validator'
import { generateSignedPass } from '@/lib/wallet/pass-generator'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { draft, images } = body as {
            draft: WalletPassDraft
            images?: {
                icon?: string // base64
                logo?: string
                strip?: string
                thumbnail?: string
                background?: string
                footer?: string
            }
        }

        // Validate draft
        const validation = validateDraft(draft)
        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Invalid draft',
                    errors: validation.errors,
                    warnings: validation.warnings
                },
                { status: 400 }
            )
        }

        // Get credentials from environment
        const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER
        const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER

        if (!passTypeIdentifier || !teamIdentifier) {
            return NextResponse.json(
                { error: 'Apple credentials not configured' },
                { status: 500 }
            )
        }

        // Convert base64 images to buffers
        const imageBuffers: Record<string, Buffer> = {}
        if (images) {
            for (const [key, value] of Object.entries(images)) {
                if (value) {
                    // Handle both data URLs and raw base64
                    const base64Data = value.includes(',') ? value.split(',')[1] : value
                    imageBuffers[key] = Buffer.from(base64Data, 'base64')
                }
            }
        }

        // Generate pass
        const passBuffer = await generateSignedPass({
            draft,
            passTypeIdentifier,
            teamIdentifier,
            serialNumber: `PASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            authenticationToken: draft.webService?.authenticationToken,
            webServiceURL: draft.webService?.webServiceURL,
            images: imageBuffers as {
                icon?: Buffer
                logo?: Buffer
                strip?: Buffer
                thumbnail?: Buffer
                background?: Buffer
                footer?: Buffer
            }
        })

        // Return as downloadable .pkpass
        return new NextResponse(new Uint8Array(passBuffer), {
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="pass-${Date.now()}.pkpass"`
            }
        })

    } catch (error) {
        console.error('Pass export error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
