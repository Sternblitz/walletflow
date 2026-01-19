
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function run() {
    console.log("Fetching campaign...")
    const { data: campaign } = await supabase.from('campaigns').select('id, config').limit(1).single()
    console.log("Campaign:", campaign)

    if (campaign) {
        // Set cooldown
        console.log("Setting cooldown to 5 min...")
        await supabase.from('campaigns').update({
            config: { ...campaign.config, scanCooldown: 5 }
        }).eq('id', campaign.id)
    }

    console.log("Fetching pass...")
    const { data: pass } = await supabase.from('passes').select('id, last_scanned_at').eq('campaign_id', campaign?.id).limit(1).single()
    console.log("Pass:", pass)
}

run()
