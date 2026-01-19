'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * Forces dark mode for admin pages
 * This component runs on the client and sets the theme to 'dark' on mount
 */
export function DarkModeEnforcer() {
    const { setTheme } = useTheme()

    useEffect(() => {
        // Force dark mode for admin pages
        setTheme('dark')
    }, [setTheme])

    // This component doesn't render anything
    return null
}
