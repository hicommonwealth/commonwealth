import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { Erc20 } from 'eth/types/Erc20';
import { Erc20Factory } from 'eth/types/Erc20Factory';

import { Moloch1 } from 'eth/types/Moloch1';
import { Moloch1Factory } from 'eth/types/Moloch1Factory';
import { GuildBank1 } from 'eth/types/GuildBank1';
import { GuildBank1Factory } from 'eth/types/GuildBank1Factory';

import { Moloch2 } from 'eth/types/Moloch2';
import { Moloch2Factory } from 'eth/types/Moloch2Factory';
import { GuildBank2 } from 'eth/types/GuildBank2';
import { GuildBank2Factory } from 'eth/types/GuildBank2Factory';

export default class MolochAPI {
  public readonly gasLimit: number = 3000000;

  private _contractAddress: string;
  private _userAddress: string;
  private _Contract: Moloch1;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: Erc20;

  public get contractAddress() { return this._contractAddress; }
  public get userAddress() { return this._userAddress; }
  public get Contract(): Moloch1 { return this._Contract; }
  public get Provider(): Web3Provider { return this._Provider; }
  public get Signer(): JsonRpcSigner { return this._Signer; }
  public get tokenContract() { return this._tokenContract; }

  constructor(contractAddress: string, web3Provider: AsyncSendable, userAddress: string) {
    this._contractAddress = contractAddress.toLowerCase();
    this._userAddress = userAddress.toLowerCase();
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Signer = this._Provider.getSigner(userAddress);
    this._Contract = Moloch1Factory.connect(contractAddress, this._Signer);
  }

  public updateSigner(userAddress: string) {
    this._Signer = this._Provider.getSigner(userAddress);
    this._Contract = Moloch1Factory.connect(this._contractAddress, this._Signer);
  }

  public async init() {
    // perform fetch of approved ERC20 token and set up contract for approval
    const tokenAddress = await this._Contract.approvedToken();
    this._tokenContract = Erc20Factory.connect(tokenAddress, this._Signer);
  }
}
