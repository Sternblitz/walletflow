
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
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        env[key] = value
    }
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    const passId = 'a60a5663-3651-4534-b5a0-65908c22f0c1'

    const { data: pass, error } = await supabase
        .from('passes')
        .select('id, serial_number, current_state')
        .eq('id', passId)
        .single()

    if (error) {
        console.error('Error fetching pass:', error)
    } else {
        console.log('Pass Details:')
        console.log('ID:', pass.id)
        console.log('Serial:', pass.serial_number)
        console.log('Customer Name:', pass.current_state?.customer_name || 'N/A')
    }
}

main()
