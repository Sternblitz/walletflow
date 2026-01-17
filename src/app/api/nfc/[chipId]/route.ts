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
        const passIdCookie = cookieStore.get(`pass_${campaignId}`)
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
                    // Show success page with review gate data
                    return new NextResponse(generateSuccessHtml(scanData, chip.location_label, passId), {
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
 * Generate a success HTML page for NFC stamp with optional review popup
 */
function generateSuccessHtml(scanData: any, locationLabel?: string, passId?: string): string {
    const stamps = scanData.newState?.stamps || 0
    const maxStamps = scanData.newState?.max_stamps || 10
    const celebration = scanData.celebration
    const message = scanData.message || 'Stempel hinzugefügt!'
    const reviewGate = scanData.reviewGate

    // Review popup HTML (shown if google_place_id is set)
    const reviewPopupHtml = reviewGate ? `
        <div id="reviewOverlay" class="review-overlay" style="display: none;">
            <div class="review-backdrop"></div>
            <div class="review-modal">
                <button class="review-close" onclick="closeReview()">&times;</button>
                <div class="review-content">
                    ${reviewGate.logoUrl ? `<img src="${reviewGate.logoUrl}" alt="${reviewGate.businessName}" class="review-logo">` : ''}
                    <h2 class="review-title">Danke für deinen Besuch! 🙏</h2>
                    <p class="review-subtitle">Eine Sekunde Zeit?<br><span style="color: ${reviewGate.accentColor}">Deine Meinung bedeutet uns wirklich viel! 💜</span></p>
                    
                    <div class="stars-container" id="starsContainer">
                        ${[1, 2, 3, 4, 5].map(i => `<button class="star" onclick="selectRating(${i})" data-rating="${i}">★</button>`).join('')}
                    </div>
                    
                    <button class="review-skip" onclick="closeReview()">Später</button>
                </div>
                
                <!-- Negative feedback (1-3 stars) -->
                <div class="review-content" id="negativeFeedback" style="display: none;">
                    <div class="emoji-icon">😔</div>
                    <h2 class="review-title">Das tut uns leid!</h2>
                    <p class="review-subtitle">Was können wir verbessern?</p>
                    <textarea id="feedbackText" class="feedback-textarea" placeholder="Dein Feedback hilft uns... (optional)"></textarea>
                    <button class="review-submit" onclick="submitFeedback()">Absenden</button>
                    <button class="review-skip" onclick="closeReview()">Überspringen</button>
                </div>
                
                <!-- Positive redirect (4-5 stars) -->
                <div class="review-content" id="positiveRedirect" style="display: none;">
                    <div class="emoji-icon">🎉</div>
                    <h2 class="review-title">Wow, danke!</h2>
                    <p class="review-subtitle">Würdest du das auch auf <strong>Google</strong> teilen?<br><span style="font-size: 0.875rem">Das hilft uns enorm! 🙏</span></p>
                    <a href="https://search.google.com/local/writereview?placeid=${reviewGate.placeId}" target="_blank" class="review-google-btn" onclick="trackGoogleRedirect()">
                        ⭐ Auf Google bewerten
                    </a>
                    <button class="review-skip" onclick="closeReview()">Nein danke</button>
                </div>
                
                <!-- Thank you -->
                <div class="review-content" id="thankYou" style="display: none;">
                    <div class="emoji-icon">💚</div>
                    <h2 class="review-title">Danke!</h2>
                    <p class="review-subtitle">Dein Feedback hilft uns, besser zu werden.</p>
                    <button class="review-submit" onclick="closeReview()">Schließen</button>
                </div>
            </div>
        </div>
    ` : ''

    const reviewStyles = reviewGate ? `
        .review-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .review-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
        .review-modal { position: relative; background: white; border-radius: 1.5rem; padding: 2rem; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .review-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; }
        .review-content { display: flex; flex-direction: column; align-items: center; }
        .review-logo { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .review-title { color: #111; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .review-subtitle { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
        .stars-container { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .star { background: none; border: none; font-size: 3rem; color: #ddd; cursor: pointer; transition: all 0.2s; }
        .star:hover, .star.active { color: #fbbf24; transform: scale(1.1); }
        .review-skip { background: none; border: none; color: #999; font-size: 0.875rem; cursor: pointer; margin-top: 0.5rem; }
        .review-skip:hover { color: #666; }
        .emoji-icon { font-size: 4rem; margin-bottom: 1rem; }
        .feedback-textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.75rem; resize: none; height: 80px; margin-bottom: 1rem; font-family: inherit; }
        .review-submit { background: #111; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; }
        .review-google-btn { background: linear-gradient(135deg, #8B5CF6, #D946EF); color: white; text-decoration: none; padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(139,92,246,0.4); }
    ` : ''

    const reviewScript = reviewGate ? `
        let selectedRating = 0;
        const campaignId = '${reviewGate.campaignId}';
        const passId = '${passId || ''}';
        const placeId = '${reviewGate.placeId}';
        
        // Show review popup after 1.5 seconds
        setTimeout(() => {
            document.getElementById('reviewOverlay').style.display = 'flex';
            trackEvent('popup_shown');
        }, 1500);
        
        function selectRating(rating) {
            selectedRating = rating;
            document.querySelectorAll('.star').forEach((star, i) => {
                star.classList.toggle('active', i < rating);
            });
            trackEvent('rating_clicked', rating);
            
            setTimeout(() => {
                if (rating <= 3) {
                    showStep('negativeFeedback');
                } else {
                    showStep('positiveRedirect');
                }
            }, 300);
        }
        
        function showStep(stepId) {
            document.querySelectorAll('.review-content').forEach(el => el.style.display = 'none');
            document.getElementById(stepId).style.display = 'flex';
        }
        
        function submitFeedback() {
            const text = document.getElementById('feedbackText').value;
            fetch('/api/reviews/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId, campaignId, rating: selectedRating, feedbackText: text })
            });
            trackEvent('feedback_submitted', selectedRating);
            showStep('thankYou');
        }
        
        function trackGoogleRedirect() {
            trackEvent('google_redirect', selectedRating);
        }
        
        function closeReview() {
            if (!selectedRating) trackEvent('dismissed');
            document.getElementById('reviewOverlay').style.display = 'none';
        }
        
        function trackEvent(eventType, rating) {
            fetch('/api/reviews/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId, campaignId, eventType, rating, metadata: { trigger: 'qr_scan' } })
            }).catch(console.error);
        }
    ` : ''

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
        ${reviewStyles}
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
    
    ${reviewPopupHtml}
    
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
    
    ${reviewScript ? `<script>${reviewScript}</script>` : ''}
    
    <script>
        // Don't auto-close if review popup will show
        ${!reviewGate ? "setTimeout(() => window.close(), 5000);" : ""}
    </script>
</body>
</html>
    `
}
