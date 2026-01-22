
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '') // remove quotes
        env[key] = value
    }
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    const passId = '9052873d-e598-49d8-9916-6e490d1f9b5e' // The pass ID from user request

    console.log(`Seeding gift for pass: ${passId}`)

    // 1. Get campaign ID from pass
    const { data: pass } = await supabase.from('passes').select('campaign_id').eq('id', passId).single()

    if (!pass) {
        console.error('Pass not found!')
        return
    }

    // 2. Insert Gift
    const { data, error } = await supabase.from('pass_gifts').insert({
        pass_id: passId,
        campaign_id: pass.campaign_id,
        gift_type: 'birthday',
        gift_title: 'Geburtstags-Überraschung 🎂',
        gift_description: 'Alles Gute! Hier ist ein gratis Kaffee für dich.',
        gift_message: 'Happy Birthday! 🎈 Komm vorbei und hol dir dein Geschenk ab.',
        birthday_date: new Date().toISOString().split('T')[0] // Today
    }).select().single()

    if (error) {
        console.error('Error inserting gift:', error)
    } else {
        console.log('✅ Gift inserted successfully:', data)
    }
}

main()
