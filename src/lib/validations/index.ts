import { z } from 'zod'

// --- SCAN API ---
export const scanSchema = z.object({
    passId: z.string().min(1, "Pass ID is required"),
    action: z.enum(['ADD_STAMP', 'REDEEM', 'CHECK_IN', 'ADD_POINTS', 'REDEEM_REWARD', 'REDEEM_VOUCHER', 'USE_VOUCHER']).optional(),
    points: z.number().int().positive().optional(),
    force: z.boolean().optional(),
    chefPin: z.string().optional(),
})

// --- ISSUE API (Query Params) ---
// Note: Next.js searchParams are strings, so we might need to preprocess or use strictly string schemas
export const issueSchema = z.object({
    campaignId: z.string().uuid("Invalid Campaign ID"),
    platform: z.enum(['ios', 'android']).optional().default('ios'),
    name: z.string().optional(),
    birthday: z.string().optional(), // Could add date validation
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    phone: z.string().optional(),
})

// --- PUSH MESSAGE API ---
export const pushMessageSchema = z.object({
    message: z.string().min(1, "Message is required").max(100, "Message too long (max 100 chars recommended)"),
    header: z.string().optional(),
    scheduleTime: z.string().datetime().optional().nullable(),
    targetType: z.enum(['all', 'inactive']).optional(),
    inactiveDays: z.number().int().min(1).optional().nullable() // e.g. 14, 30, 60 or custom
})

// --- APP CREDENTIALS API ---
export const appCredentialsSchema = z.object({
    credentials: z.array(z.object({
        id: z.string().optional(),
        role: z.enum(['staff', 'chef']),
        label: z.string().optional(),
        pin_code: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional().or(z.literal(''))
        // Allow empty string if just clearing? Actually UI sends '******' for masked.
        // But for updates we want to allow skipping. 
        // Let's keep it simple: if provided, must be digits.
    }))
})
