import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const formData = await request.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'uploads'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('public')
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(filename)

        return NextResponse.json({
            url: publicUrl,
            path: data.path
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
