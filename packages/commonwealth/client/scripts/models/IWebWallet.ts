import type { Awaitable, SessionSigner } from '@canvas-js/interfaces';
import type { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';

import type BlockInfo from './BlockInfo';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  api?: any;
  enable: (forceChainId?: string) => Promise<void>;
  reset?: () => Promise<void>;

  getChainId(): string | null;

  getRecentBlock: (chainIdentifier: string) => Promise<BlockInfo>;

  getSessionSigner: () => Awaitable<SessionSigner>;

  switchNetwork?(chainId?: string): Promise<void>;

  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
