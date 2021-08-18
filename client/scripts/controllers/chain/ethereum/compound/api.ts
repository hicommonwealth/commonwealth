import { GovernorAlpha, MPond, MPond__factory } from 'eth/types';

import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class CompoundAPI extends ContractApi<GovernorAlpha> {
  private _Token: MPond;
  public get Token() { return this._Token; }

  // private _Timelock: Timelock;
  // public get Timelock() { return this._Timelock; }

  public async init(tokenName: string) {
    await super.init();
    // i.e. "uni" or "MPond" -- should refer to a call
    if (tokenName) {
      try {
        const tokenAddress = await this.Contract[tokenName]();
        this._Token = MPond__factory.connect(tokenAddress, this.Contract.signer || this.Contract.provider);
      } catch (err) {
        console.error(`Could not fetch token ${tokenName}: ${err.message}`);
      }
    } else {
      console.error('No token name found!');
    }
    // const timelockAddress = await this.Contract.timelock();
    // this._Timelock = Timelock__factory.connect(timelockAddress, this.Contract.signer || this.Contract.provider);
  }
}
