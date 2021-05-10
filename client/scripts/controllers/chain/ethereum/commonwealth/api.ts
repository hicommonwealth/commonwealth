import ContractApi, { ContractFactoryT } from 'controllers/chain/ethereum/contractApi';

// import { Erc20 } from 'Erc20';
// import { Erc20Factory } from 'Erc20Factory';
import { CwProtocol as CWProtocol } from 'CWProtocol';
import { CwProtocolFactory as CWProtocolFactory } from 'CwProtocolFactory';

export default class CommonwealthAPI extends ContractApi<CWProtocol> {
  private _CWProtocolContractAddress: string;
  public get CWProtocolContractAddress() { return this._CWProtocolContractAddress; }
  private _CWProtocolContract: CWProtocol;
  public get CWProtocolContract(): CWProtocol { return this._CWProtocolContract; }

  public async init(): Promise<void>{
    // this._CWProtocolContractAddress = '0x487f2D9f9427bBBC97cDc2F77Ab3083ea82b2496';
    // this._CWProtocolContract = CWProtocolFactory.connect(this._CWProtocolContractAddress, this.Provider);

    // perform fetch of approved ERC20 token and set up contract for approval
    // const tokenAddress = await this._CWProtocolContract.approvedToken();
    // this._tokenContract = Erc20Factory.connect(tokenAddress, this._Signer);
  }
}
