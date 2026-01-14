'use server'

import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo/draft purposes, just redirect to admin
    redirect('/admin')
}
