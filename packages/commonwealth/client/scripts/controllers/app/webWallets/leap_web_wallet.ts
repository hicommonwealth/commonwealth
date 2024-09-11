import { CosmosSignerCW, WalletId } from '@hicommonwealth/shared';
import app from 'state';
import KeplrLikeWebWalletController from './keplr_like_web_wallet';

export interface LeapWindow {
  leap?: {
    signArbitrary: (
      chainId: string,
      address: string,
      msg: string,
    ) => Promise<{
      pub_key: {
        type: string;
        value: string;
      };
      signature: string;
    }>;
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends LeapWindow {}
}

class LeapWebWalletController extends KeplrLikeWebWalletController {
  constructor() {
    super(WalletId.Leap, 'Leap');
  }

  public getSessionSigner() {
    return new CosmosSignerCW({
      bech32Prefix: app.chain?.meta.bech32_prefix || 'osmo',
      signer: {
        type: 'arbitrary',
        signArbitrary: (msg) =>
          // @ts-expect-error <StrictNullChecks>
          window.leap.signArbitrary(
            this.getChainId(),
            this.accounts[0].address,
            msg,
          ),
        getAddress: () => this.accounts[0].address,
        getChainId: () => this.getChainId() || 'osmosis-1',
      },
    });
  }
}

export default LeapWebWalletController;
