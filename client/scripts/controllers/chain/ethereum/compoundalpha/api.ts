import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

import { Uni } from 'Uni';
import { UniFactory } from 'UniFactory';
import { GovernorAlpha } from 'GovernorAlpha';
import { GovernorAlphaFactory } from 'GovernorAlphaFactory';
import { BigNumber } from 'ethers/utils';

export default class CompoundalphaAPI {
  public readonly gasLimit: number = 3000000;

  private _userAddress: string;
  private _UniAddress: string;
  private _GovernorAlphaAddress: string;
  private _UniContract: Uni;
  private _GovernorAlphaContract: GovernorAlpha;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: Erc20;
  private _userUni: BigNumber;
  private _Symbol: string;
  private _Bridge: string;

  public get userAddress() { return this._userAddress; }
  public get uniAddress() { return this._UniAddress; }
  public get governorAlphaAddress() { return this._GovernorAlphaAddress; }
  public get uniContract(): Uni { return this._UniContract; }
  public get governorAlphaContract(): GovernorAlpha { return this._GovernorAlphaContract; }

  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get tokenContract() { return this._tokenContract; }
  public get userUni(): number { return this._userUni.toNumber(); }
  public get symbol(): string { return this._Symbol; }
  public get bridge(): string { return this._Bridge; }

  constructor(
    uniAddress: string,
    governorAlphaAddress: string,
    web3Provider: AsyncSendable,
    userAddress?: string,
  ) {
    this._Provider = new ethers.providers.Web3Provider(web3Provider);

    if (userAddress) {
      this._userAddress = userAddress.toLowerCase();
      this._Signer = this._Provider.getSigner(userAddress);
    }

    this._UniAddress = uniAddress.toLowerCase();
    this._GovernorAlphaAddress = governorAlphaAddress.toLowerCase();
    if (this._Signer) {
      this._UniContract = UniFactory.connect(uniAddress, this._Signer);
      this._GovernorAlphaContract = GovernorAlphaFactory.connect(governorAlphaAddress, this._Signer);
    } else {
      this._UniContract = UniFactory.connect(uniAddress, this._Provider);
      this._GovernorAlphaContract = GovernorAlphaFactory.connect(governorAlphaAddress, this._Provider);
    }
  }

  public updateSigner(userAddress: string) {
    console.log('inside signer', userAddress);
    this._Signer = this._Provider.getSigner(userAddress);
    this._UniContract = UniFactory.connect(this._UniAddress, this._Signer);
    this._GovernorAlphaContract = GovernorAlphaFactory.connect(this._GovernorAlphaAddress, this._Signer);
  }

  public async init() {
    // perform fetch of approved ERC20 token and set up contract for approval
    const tokenAddress = this._UniContract.address;
    this._tokenContract = Erc20Factory.connect(tokenAddress, this._Provider);
    if (this._userAddress) this._userUni = await this._UniContract.balanceOf(this._userAddress);
    this._Symbol = await this._UniContract.symbol();
  }
}
