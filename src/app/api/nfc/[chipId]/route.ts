import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface Params {
    params: Promise<{ chipId: string }>
}

/**
 * GET /api/nfc/[chipId]
 * 
 * NFC tap handler - called when customer taps phone on NFC chip
 * 
 * Flow:
 * 1. Look up chip by code
 * 2. Check if customer has existing pass (via cookie)
 * 3. If yes: add stamp automatically
 * 4. If no: redirect to Smart Link for pass creation
 */
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { chipId } = await params

        if (!chipId) {
            return NextResponse.json({ error: 'Missing chip ID' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Look up the NFC chip
        const { data: chip, error: chipError } = await supabase
            .from('nfc_chips')
            .select('*, campaign:campaigns(id, client:clients(slug))')
            .eq('chip_code', chipId)
            .eq('is_active', true)
            .single()

        if (chipError || !chip) {
            return NextResponse.json({
                error: 'NFC chip not found or inactive'
            }, { status: 404 })
        }

        // Update chip scan count
        await supabase
            .from('nfc_chips')
            .update({
                scans_count: chip.scans_count + 1,
                last_scan_at: new Date().toISOString()
            })
            .eq('id', chip.id)

        const campaignId = chip.campaign_id
        const clientSlug = chip.campaign?.client?.slug

        // 2. Check for existing pass ID in cookie
        const cookieStore = await cookies()
        const passIdCookie = cookieStore.get(`passify_pass_${campaignId}`)
        const passId = passIdCookie?.value

        if (passId) {
            // 3. Customer has a pass - add stamp!
            try {
                const scanRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passId, action: 'ADD_STAMP' })
                })

                const scanData = await scanRes.json()

                if (scanRes.ok) {
                    // Show success page
                    return new NextResponse(generateSuccessHtml(scanData, chip.location_label), {
                        headers: { 'Content-Type': 'text/html' }
                    })
                }
            } catch (e) {
                console.error('NFC scan error:', e)
            }
        }

        // 4. No pass or scan failed - redirect to Smart Link
        if (clientSlug) {
            return NextResponse.redirect(
                new URL(`/start/${clientSlug}`, req.url)
            )
        }

        // Fallback error
        return NextResponse.json({
            error: 'Unable to process NFC tap'
        }, { status: 500 })

    } catch (e) {
        console.error('NFC handler error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

/**
 * Generate a success HTML page for NFC stamp
 */
function generateSuccessHtml(scanData: any, locationLabel?: string): string {
    const stamps = scanData.newState?.stamps || 0
    const maxStamps = scanData.newState?.max_stamps || 10
    const celebration = scanData.celebration
    const message = scanData.message || 'Stempel hinzugefügt!'

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stempel erhalten! ✅</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 2rem;
            text-align: center;
        }
        .icon {
            font-size: 5rem;
            margin-bottom: 1rem;
            animation: bounce 0.6s ease-out;
        }
        @keyframes bounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
        }
        .message {
            color: #888;
            margin-bottom: 2rem;
        }
        .progress {
            background: rgba(255,255,255,0.1);
            border-radius: 1rem;
            padding: 1.5rem 2rem;
            margin-bottom: 1rem;
        }
        .stamps {
            font-size: 2.5rem;
            font-weight: bold;
            color: #4ade80;
        }
        .label {
            color: #666;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        .location {
            color: #666;
            font-size: 0.75rem;
            margin-top: 2rem;
        }
        ${celebration ? `
        .confetti {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }
        .confetti-piece {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #4ade80;
            animation: fall 3s linear forwards;
        }
        @keyframes fall {
            to { transform: translateY(100vh) rotate(720deg); }
        }
        ` : ''}
    </style>
</head>
<body>
    ${celebration ? '<div class="confetti"></div>' : ''}
    <div class="icon">${celebration ? '🎉' : '✅'}</div>
    <h1>${message}</h1>
    <p class="message">NFC Stempel erfolgreich</p>
    <div class="progress">
        <div class="stamps">${stamps} / ${maxStamps}</div>
        <div class="label">Stempel gesammelt</div>
    </div>
    ${locationLabel ? `<p class="location">📍 ${locationLabel}</p>` : ''}
    
    ${celebration ? `
    <script>
        const confetti = document.querySelector('.confetti');
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.background = ['#4ade80', '#fbbf24', '#f472b6', '#60a5fa'][Math.floor(Math.random() * 4)];
            confetti.appendChild(piece);
        }
    </script>
    ` : ''}
    
    <script>
        // Auto-close after 5 seconds
        setTimeout(() => window.close(), 5000);
    </script>
</body>
</html>
    `
}
