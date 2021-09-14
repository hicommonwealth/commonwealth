import { ChainBase } from './types';
import Account from './Account';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: string;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  enable: () => Promise<void>;
  validateWithAccount: (account: Account<any>, chain?: string) => Promise<void>;

  chain: ChainBase;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChain?: string;
}

export default IWebWallet;
