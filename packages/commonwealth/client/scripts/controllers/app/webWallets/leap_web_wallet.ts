import { OfflineAminoSigner } from '@cosmjs/amino';
import type { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { WalletId } from '@hicommonwealth/shared';
import { SecretUtils } from '@keplr-wallet/types/build/secretjs';
import KeplrLikeWebWalletController from './keplr_like_web_wallet';

export interface LeapWindow {
  leap?: {
    getOfflineSigner?: (
      chainId: string,
    ) => OfflineAminoSigner & OfflineDirectSigner;
    getOfflineSignerOnlyAmino?: (chainId: string) => OfflineAminoSigner;
    getOfflineSignerAuto?: (
      chainId: string,
    ) => Promise<OfflineAminoSigner | OfflineDirectSigner>;
    getEnigmaUtils?: (chainId: string) => SecretUtils;
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
}

export default LeapWebWalletController;
