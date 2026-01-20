'use client'

import { useState } from 'react'

interface ConsentCheckboxProps {
    accentColor?: string
    textColor?: string
    onConsentChange: (accepted: boolean) => void
}

export function ConsentCheckbox({
    accentColor = '#22C55E',
    textColor = '#FFFFFF',
    onConsentChange,
}: ConsentCheckboxProps) {
    const [isChecked, setIsChecked] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        setIsChecked(checked)
        onConsentChange(checked)
    }

    return (
        <label
            className="flex items-start gap-3 cursor-pointer group select-none"
            style={{ color: textColor }}
        >
            {/* Custom Checkbox */}
            <div className="relative flex-shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleChange}
                    className="sr-only peer"
                    required
                />
                <div
                    className="w-5 h-5 border-2 rounded transition-all duration-200 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-transparent"
                    style={{
                        borderColor: isChecked ? accentColor : 'rgba(255,255,255,0.4)',
                        backgroundColor: isChecked ? accentColor : 'transparent',
                    }}
                >
                    {isChecked && (
                        <svg
                            className="w-full h-full text-white p-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M5 12l5 5L20 7" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Label Text */}
            <span className="text-sm leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                Ich akzeptiere die{' '}
                <a
                    href="#datenschutz"
                    className="underline hover:no-underline font-medium"
                    style={{ color: accentColor }}
                    onClick={(e) => e.stopPropagation()}
                >
                    Datenschutzerklärung
                </a>
                {' '}und{' '}
                <a
                    href="#nutzungsbedingungen"
                    className="underline hover:no-underline font-medium"
                    style={{ color: accentColor }}
                    onClick={(e) => e.stopPropagation()}
                >
                    Nutzungsbedingungen
                </a>
                .
            </span>
        </label>
    )
}
