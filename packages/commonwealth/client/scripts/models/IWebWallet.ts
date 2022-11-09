import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import Account from './Account';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  api: any;
  enable: () => Promise<void>;
  validateWithAccount: (
    account: Account,
    walletSignature: string
  ) => Promise<void>; // TODO add optional parameter: Function Callback
  signWithAccount: (account: Account) => Promise<string>;
  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
