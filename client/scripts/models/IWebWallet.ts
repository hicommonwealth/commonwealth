import { ChainBase } from './types';

interface IWebWallet<AccountT = string> {
  label: string;
  available: boolean;
  enabled: boolean;
  accounts: AccountT[];
  enable: () => Promise<void>;

  chain: ChainBase;
}

export default IWebWallet;
