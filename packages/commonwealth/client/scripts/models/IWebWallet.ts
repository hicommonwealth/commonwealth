import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import Account from './Account';
import NodeInfo from './NodeInfo';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  enable: () => Promise<void>;
  signWithAccount: (account: Account) => Promise<string>;
  validateWithAccount: (
    account: Account,
    walletSignature: string
  ) => Promise<void>;
  reset?: () => Promise<void>;

  chain: ChainBase;
  defaultNetwork: ChainNetwork;
  node?: NodeInfo;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
