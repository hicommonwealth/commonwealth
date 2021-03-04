import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

export default class TokenAPI {
  public readonly gasLimit: number = 3000000;

  private _contractAddress: string;
  private _userAddress: string;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _Contract: Erc20;

  public get contractAddress() { return this._contractAddress; }
  public get userAddress() { return this._userAddress; }
  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get Contract() { return this._Contract; }

  constructor(contractAddress: string, web3Provider: AsyncSendable, userAddress: string) {
    this._contractAddress = contractAddress.toLowerCase();
    this._userAddress = userAddress.toLowerCase();
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Signer = this._Provider.getSigner(userAddress);
    this._Contract = Erc20Factory.connect(contractAddress, this._Signer);
  }

  public updateSigner(userAddress: string) {
    this._Signer = this._Provider.getSigner(userAddress);
    this._Contract = Erc20Factory.connect(this._contractAddress, this._Signer);
  }

  public async init() {
    // Set up contract
    this._Contract = Erc20Factory.connect(this._contractAddress, this._Signer);
  }
}
