import { WalletId } from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import { CosmosSignerCW } from 'shared/canvas/sessionSigners';
import KeplrLikeWebWalletController from './keplr_like_web_wallet';

export interface LeapWindow {
  leap?: any;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends LeapWindow {}
}

class LeapWebWalletController extends KeplrLikeWebWalletController {
  constructor() {
    super(WalletId.Leap, 'Leap');
  }

  public async getSessionSigner() {
    return new CosmosSignerCW({
      bech32Prefix: app.chain?.meta.bech32Prefix,
      signer: {
        type: 'arbitrary',
        signArbitrary: (msg) =>
          window.leap.signArbitrary(
            this.getChainId(),
            this.accounts[0].address,
            msg,
          ),
        getAddress: async () => this.accounts[0].address,
        getChainId: async () => this.getChainId(),
      },
    });
  }
}

export default LeapWebWalletController;
