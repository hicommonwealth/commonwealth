import type { ChainId, SessionPayload } from '@canvas-js/interfaces';
import type {
  ChainBase,
  ChainNetwork,
  WalletId,
} from 'common-common/src/types';

import type Account from './Account';
import type BlockInfo from './BlockInfo';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  api?: any;
  enable: () => Promise<void>;
  reset?: () => Promise<void>;

  getChainId(): ChainId | null;

  getRecentBlock: (chainIdentifier: string) => Promise<BlockInfo>;

  signCanvasMessage(
    account: Account,
    canvasMessage: SessionPayload
  ): Promise<string>;

  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
