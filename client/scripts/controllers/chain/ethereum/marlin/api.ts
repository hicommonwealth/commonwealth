import { ExternalProvider } from '@ethersproject/providers';

import { MPond, GovernorAlpha, GovernorAlpha__factory } from 'eth/types';

import ContractApi, { ContractFactoryT } from 'controllers/chain/ethereum/contractApi';

export default class MarlinAPI extends ContractApi<MPond> {
  private _GovernorAlphaAddress: string;
  private _GovernorAlphaContract: GovernorAlpha;
  private _Symbol: string;

  public get governorAlphaAddress() { return this._GovernorAlphaAddress; }
  public get governorAlphaContract(): GovernorAlpha { return this._GovernorAlphaContract; }

  public get symbol(): string { return this._Symbol; }

  constructor(
    factory: ContractFactoryT<MPond>,
    mPondAddress: string,
    governorAlphaAddress: string,
    web3Provider: ExternalProvider,
  ) {
    super(factory, mPondAddress, web3Provider);
    this._GovernorAlphaAddress = governorAlphaAddress;
    this._GovernorAlphaContract = GovernorAlpha__factory.connect(governorAlphaAddress, this.Provider);
  }

  public async init() {
    // MPond is the token
    await super.init(this.contractAddress);
    this._Symbol = await this.Contract.symbol();
  }
}
