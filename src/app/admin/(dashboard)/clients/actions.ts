'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteClient(clientId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId)

        if (error) {
            throw new Error(error.message)
        }

        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete client:', error)
        return { success: false, error: 'Failed to delete client' }
    }
}
