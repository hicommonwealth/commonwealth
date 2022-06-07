import { ChainBase, WalletId } from 'types';
import Account from './Account';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  enable: () => Promise<void>;
  validateWithAccount: (account: Account<any>) => Promise<void>;
  signMessage: (message: string) => Promise<string>;

  chain: ChainBase;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
