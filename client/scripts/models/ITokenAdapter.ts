import BN from 'bn.js';
import { Coin } from 'adapters/currency';
import { Account, IChainAdapter } from '.';

// Extension of IChainAdapter to support Token functionality
// See controller/ethereum/tokenAdapter for example usage
export default abstract class ITokenAdapter extends IChainAdapter<Coin, Account<Coin>> {
  public readonly contractAddress: string;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);

  public abstract activeAddressHasToken(activeAddress?: string): Promise<boolean>;
}
