import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

import { MPond } from 'MPond';
import { MPondFactory } from 'MPondFactory';
import { GovernorAlpha } from 'GovernorAlpha';
import { GovernorAlphaFactory } from 'GovernorAlphaFactory';
import { BigNumber } from 'ethers/utils';

export default class MarlinAPI {
  public readonly gasLimit: number = 3000000;

  private _userAddress: string;
  private _MPondAddress: string;
  private _GovernorAlphaAddress: string;
  private _MPondContract: MPond;
  private _GovernorAlphaContract: GovernorAlpha;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: Erc20;
  private _userMPond: BigNumber;
  private _Symbol: string;

  public get userAddress() { return this._userAddress; }
  public get mPondAddress() { return this._MPondAddress; }
  public get governorAlphaAddress() { return this._GovernorAlphaAddress; }
  public get mPondContract(): MPond { return this._MPondContract; }
  public get governorAlphaContract(): GovernorAlpha { return this._GovernorAlphaContract; }

  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get tokenContract() { return this._tokenContract; }
  public get userMPond(): number { return this._userMPond.toNumber(); }
  public get symbol(): string { return this._Symbol; }

  constructor(
    mPondAddress: string,
    governorAlphaAddress: string,
    web3Provider: AsyncSendable,
    userAddress: string,
  ) {
    this._userAddress = userAddress.toLowerCase();
    this._MPondAddress = mPondAddress.toLowerCase();
    this._GovernorAlphaAddress = governorAlphaAddress.toLowerCase();
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Signer = this._Provider.getSigner(userAddress);
    this._MPondContract = MPondFactory.connect(mPondAddress, this._Signer);
    this._GovernorAlphaContract = GovernorAlphaFactory.connect(governorAlphaAddress, this._Signer);
  }

  public updateSigner(userAddress: string) {
    this._Signer = this._Provider.getSigner(userAddress);
    this._MPondContract = MPondFactory.connect(this._MPondAddress, this._Signer);
    this._GovernorAlphaContract = GovernorAlphaFactory.connect(this._GovernorAlphaAddress, this._Signer);
  }

  public async init() {
    // perform fetch of approved ERC20 token and set up contract for approval
    const tokenAddress = await this._MPondContract.address;
    this._tokenContract = Erc20Factory.connect(tokenAddress, this._Signer);
    this._userMPond = await this._MPondContract.balanceOf(this._userAddress);
    this._Symbol = await this._MPondContract.symbol();
  }
}
