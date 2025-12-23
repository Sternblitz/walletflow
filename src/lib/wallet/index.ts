import { AppleWalletService } from './apple'
import { GoogleWalletService } from './google'
import { UniversalPassConfig } from './types'

export class WalletBroker {
    private appleService: AppleWalletService
    private googleService: GoogleWalletService

    constructor() {
        this.appleService = new AppleWalletService()
        this.googleService = new GoogleWalletService()
    }

    async generatePass(
        platform: 'apple' | 'google',
        config: UniversalPassConfig
    ): Promise<Buffer> {
        if (platform === 'apple') {
            return this.appleService.generatePass(config)
        } else {
            return this.googleService.generatePass(config)
        }
    }
}
