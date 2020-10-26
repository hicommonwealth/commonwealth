import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

import { Comp } from 'Comp';
import { CompFactory } from 'CompFactory';
import { GovernorAlpha } from 'GovernorAlpha';
import { GovernorAlphaFactory } from 'GovernorAlphaFactory';

export default class MarlinAPI {
  public readonly gasLimit: number = 3000000;

  private _userAddress: string;
  private _CompAddress: string;
  private _GovernorAlphaAddress: string;
  private _CompContract: Comp;
  private _GovernorAlphaContract: GovernorAlpha;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: Erc20;

  public get userAddress() { return this._userAddress; }
  public get compAddress() { return this._CompAddress; }
  public get governorAlphaAddress() { return this._GovernorAlphaAddress; }
  public get compContract(): Comp { return this._CompContract; }
  public get governorAlphaContract(): GovernorAlpha { return this._GovernorAlphaContract; }

  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get tokenContract() { return this._tokenContract; }

  constructor(
    compAddress: string,
    governorAlphaAddress: string,
    web3Provider: AsyncSendable,
    userAddress: string,
  ) {
    this._userAddress = userAddress.toLowerCase();
    this._CompAddress = compAddress.toLowerCase();
    this._GovernorAlphaAddress = governorAlphaAddress.toLowerCase();
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Signer = this._Provider.getSigner(userAddress);
    this._CompContract = CompFactory.connect(compAddress, this._Signer);
    this._GovernorAlphaContract = GovernorAlphaFactory.connect(governorAlphaAddress, this._Signer);
  }

  public updateSigner(userAddress: string) {
    this._Signer = this._Provider.getSigner(userAddress);
    this._CompContract = CompFactory.connect(this._CompAddress, this._Signer);
    this._GovernorAlphaContract = GovernorAlphaFactory.connect(this._GovernorAlphaAddress, this._Signer);
  }

  public async init() {
    // perform fetch of approved ERC20 token and set up contract for approval
    // TODO: Do I need to fetch the token? It's in the Comp API Constructor as CompContract
    const tokenAddress = await this._CompContract.address;
    this._tokenContract = Erc20Factory.connect(tokenAddress, this._Signer);
  }
}
