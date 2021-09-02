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
  validateWithAccount: (account: Account<any>) => Promise<void>;

  chain: ChainBase;
  specificChain?: string;
}

export default IWebWallet;
