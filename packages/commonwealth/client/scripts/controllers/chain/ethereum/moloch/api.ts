import { Moloch1, ERC20, ERC20__factory } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class MolochAPI extends ContractApi<Moloch1> {
  private _token: ERC20;
  public get token() { return this._token; }

  public async init(): Promise<void> {
    await super.init();
    const tokenAddress = await this.Contract.approvedToken();
    this._token = ERC20__factory.connect(tokenAddress, this.Provider);
    await this._token.deployed();
  }
}
