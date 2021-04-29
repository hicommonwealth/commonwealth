import { AsyncSendable } from 'ethers/providers';

import { MPond } from 'MPond';
import { MPondFactory } from 'MPondFactory';
import { GovernorAlpha } from 'GovernorAlpha';
import { GovernorAlphaFactory } from 'GovernorAlphaFactory';

import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class MarlinAPI extends ContractApi<MPond> {
  private _GovernorAlphaAddress: string;
  private _GovernorAlphaContract: GovernorAlpha;
  private _Symbol: string;

  public get governorAlphaAddress() { return this._GovernorAlphaAddress; }
  public get governorAlphaContract(): GovernorAlpha { return this._GovernorAlphaContract; }

  public get symbol(): string { return this._Symbol; }

  constructor(
    factory: MPondFactory,
    mPondAddress: string,
    governorAlphaAddress: string,
    web3Provider: AsyncSendable,
  ) {
    super(factory, mPondAddress, web3Provider);
    this._GovernorAlphaAddress = governorAlphaAddress.toLowerCase();
    const governorAlphaFactory = new GovernorAlphaFactory();
    this._GovernorAlphaContract = governorAlphaFactory.attach(governorAlphaAddress);
  }

  public async init() {
    // MPond is the token
    await super.init(this.contractAddress);
    this._Symbol = await this.Contract.symbol();
  }
}
