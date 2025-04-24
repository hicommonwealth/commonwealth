import { ChainBase } from '@hicommonwealth/shared';
import Account from '../../../models/Account';
import { SuiCoin } from './types';

class SuiAccount extends Account {
  public readonly base = ChainBase.Sui;
  public readonly coins: SuiCoin[] = [];

  constructor(
    address: string,
    community: any,
    chainId: string,
    isAddressValid = true,
  ) {
    super(address, community, isAddressValid);
    this.chainId = chainId;
  }

  public get balance() {
    return this.coins.reduce(
      (prev, current) =>
        prev + Number(current.balance) / Math.pow(10, current.decimals),
      0,
    );
  }
}

export default SuiAccount;
