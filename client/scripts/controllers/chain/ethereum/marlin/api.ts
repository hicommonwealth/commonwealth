import { GovernorAlpha, MPond, MPond__factory, Timelock, Timelock__factory } from 'eth/types';

import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class MarlinAPI extends ContractApi<GovernorAlpha> {
  private _MPondAddress: string;
  public get MPondAddress() { return this._MPondAddress; }

  private _MPond: MPond;
  public get MPond() { return this._MPond; }

  private _Timelock: Timelock;
  public get Timelock() { return this._Timelock; }

  public async init() {
    await super.init();
    this._MPondAddress = await this.Contract.MPond();
    this._MPond = MPond__factory.connect(this._MPondAddress, this.Contract.signer || this.Contract.provider);
    const timelockAddress = await this.Contract.timelock();
    console.log(timelockAddress);
    this._Timelock = Timelock__factory.connect(timelockAddress, this.Contract.signer || this.Contract.provider);
  }
}
