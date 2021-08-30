import { GovernorAlpha, MPond, MPond__factory } from 'eth/types';
import { utils } from 'ethers';

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
        // ABI hack to call arbitrarily named functions on GovAlpha contracts
        const ABI = [
          {
            'inputs': [],
            'name': tokenName,
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'stateMutability': 'view',
            'type': 'function'
          }
        ];
        const iface = new utils.Interface(JSON.stringify(ABI));
        const data = iface.encodeFunctionData(tokenName);
        const resultData = await this.Contract.provider.call({ to: this.Contract.address, data });
        const tokenAddress = utils.getAddress(Buffer.from(utils.stripZeros(resultData)).toString('hex'));
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
