import type { Window as KeplrWindow } from '@keplr-wallet/types';

import { WalletId } from '@hicommonwealth/core';
import KeplrLikeWebWalletController from './keplr_like_web_wallet';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

class KeplrWebWalletController extends KeplrLikeWebWalletController {
  constructor() {
    super(WalletId.Keplr, 'Keplr');
  }
}

export default KeplrWebWalletController;
