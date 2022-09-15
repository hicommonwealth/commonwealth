import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { RLPEncodedTransaction, TransactionConfig } from 'web3-core/types';
import Account from './Account';

interface IWebWallet<AccountT extends { address: string } | string> {
  name: WalletId;
  label: string;
  available: boolean;
  enabled: boolean;
  enabling: boolean;
  accounts: readonly AccountT[];
  enable: () => Promise<void>;
  validateWithAccount: (account: Account) => Promise<void>;
  // TODO add optional parameter: Function Callback
  signTransaction: (tx: TransactionConfig, signerAddress: string) => Promise<RLPEncodedTransaction>;
  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];
}

export default IWebWallet;
