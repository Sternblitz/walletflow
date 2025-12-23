import { UniversalPassConfig, WalletService } from './types'
import { v4 as uuidv4 } from 'uuid'
// import { GoogleAuth } from 'google-auth-library'

export class GoogleWalletService implements WalletService {
    async generatePass(config: UniversalPassConfig): Promise<Buffer> {

        // In Google world, we don't generate a binary file like .pkpass
        // Instead, we generate a signed JWT (JSON Web Token) link.
        // For this prototype, we will return a Buffer containing the "Save Link".

        const googlePassObject = {
            id: config.serialNumber,
            classId: process.env.GOOGLE_WALLET_CLASS_ID,
            heroImage: {
                sourceUri: { uri: "https://example.com/hero.jpg" }
            },
            textModulesData: (config.secondaryFields || []).map(f => ({
                header: f.label,
                body: f.value
            }))
        }

        // TODO: Sign this object with Google Service Account Key
        // const auth = new GoogleAuth(...)

        const fakeLink = `https://pay.google.com/gp/v/save/${uuidv4()}`

        return Buffer.from(fakeLink)
    }
}
