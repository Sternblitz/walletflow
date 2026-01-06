import { NextRequest, NextResponse } from "next/server"
import { WalletBroker } from "@/lib/wallet"

const broker = new WalletBroker()

// Simple smoke-test route to verify Apple/Google Wallet setup
// No Datenbank, keine Campaigns – nur ein statischer Test-Pass.
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get("platform") || "ios"

    const passConfig = {
        serialNumber: "test-" + Date.now().toString(),

        // Visuals
        logoText: "QARD Test Pass",
        backgroundColor: "#000000",
        labelColor: "#ffffff",
        foregroundColor: "#ffffff",

        // Content
        headerLabel: "BALANCE",
        headerValue: "0",
        primaryLabel: "STAMPS",
        primaryValue: "0 / 10",

        secondaryFields: [
            { label: "STATUS", value: "Test Mode" },
            { label: "INFO", value: "If you see this, Apple setup works." },
        ],

        barcodeValue: "https://qard.io/local",
    }

    try {
        if (platform === "ios") {
            const buffer = await broker.generatePass("apple", passConfig)

            return new NextResponse(buffer as any, {
                status: 200,
                headers: {
                    "Content-Type": "application/vnd.apple.pkpass",
                    "Content-Disposition": "attachment; filename=qard-test.pkpass",
                },
            })
        } else {
            const buffer = await broker.generatePass("google", passConfig)
            const saveUrl = buffer.toString()
            return NextResponse.redirect(saveUrl)
        }
    } catch (e: any) {
        console.error("Test pass generation failed:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}



