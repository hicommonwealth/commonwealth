import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import ContractApi from 'controllers/chain/ethereum/contractApi';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

import { CwProtocol as CWProtocol } from 'CWProtocol';
import { CwProtocolFactory as CWProtocolFactory } from 'CwProtocolFactory';

export default class CommonwealthAPI {
  public readonly gasLimit: number = 300000;

  private _userAddress: string;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: Erc20;

  
  public get userAddress() { return this._userAddress; }
  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get tokenContract(): Erc20 { return this._tokenContract; }

  private _CWProtocolContractAddress: string;
  public get CWProtocolContractAddress() { return this._CWProtocolContractAddress; }
  private _CWProtocolContract: CWProtocol;
  public get CWProtocolContract(): CWProtocol { return this._CWProtocolContract; }


  constructor(
    web3Provider: AsyncSendable,
    userAddress?: string
  ) {
    this._CWProtocolContractAddress = '0x487f2D9f9427bBBC97cDc2F77Ab3083ea82b2496';

    if (userAddress) {
      this._userAddress = userAddress.toLowerCase();
    } else {
      this._userAddress = '0';
    }
    
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Signer = this._Provider.getSigner(userAddress);
    this._CWProtocolContract = CWProtocolFactory.connect(this._CWProtocolContractAddress, this._Signer);
  }

  public updateSigner(userAddress: string) {
    this._Signer = this._Provider.getSigner(userAddress);
    this._CWProtocolContract = CWProtocolFactory.connect(this._CWProtocolContractAddress, this._Signer);
  }

  public async init() {
    // perform fetch of approved ERC20 token and set up contract for approval
    // const tokenAddress = await this._CWProtocolContract.approvedToken();
    // this._tokenContract = Erc20Factory.connect(tokenAddress, this._Signer);
  }
}
