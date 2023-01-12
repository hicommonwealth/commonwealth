import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import Account from './Account';
import BlockInfo from './BlockInfo';
import { CanvasData } from 'shared/adapters/shared';
import { ChainId } from '@canvas-js/interfaces';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  api?: any;
  enable: () => Promise<void>;
  enableForEthChainId?: (chainId: string | number) => Promise<void>;
  reset?: () => Promise<void>;

  getChainId(): ChainId | null;
  getRecentBlock: (chainIdentifier: string) => Promise<BlockInfo>;

  signCanvasMessage(account: Account, canvasMessage: CanvasData): Promise<string>;

  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
