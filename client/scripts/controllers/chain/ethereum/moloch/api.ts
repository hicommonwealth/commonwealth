import { Web3Provider, AsyncSendable, JsonRpcSigner } from 'ethers/providers';
import { ethers } from 'ethers';

import { ERC20 } from 'ERC20';
import { ERC20Factory } from 'ERC20Factory';

import { Moloch1 } from 'MolochV1/Moloch1';
import { Moloch1Factory } from 'MolochV1/Moloch1Factory';
import { GuildBank1 } from 'MolochV1/GuildBank1';
import { GuildBank1Factory } from 'MolochV1/GuildBank1Factory';

import { Moloch2 } from 'MolochV2/Moloch2';
import { Moloch2Factory } from 'MolochV2/Moloch2Factory';
import { GuildBank2 } from 'MolochV2/GuildBank2';
import { GuildBank2Factory } from 'MolochV2/GuildBank2Factory';

export default class MolochAPI {
  public readonly gasLimit: number = 3000000;

  private _contractAddress: string;
  private _userAddress: string;
  private _Contract: Moloch1;
  private _Provider: Web3Provider;
  private _Signer: JsonRpcSigner;
  private _tokenContract: ERC20;

  public get contractAddress() { return this._contractAddress; }
  public get userAddress() { return this._userAddress; }
  public get Contract() { return this._Contract; }
  public get Provider() { return this._Provider; }
  public get Signer() { return this._Signer; }
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
    this._tokenContract = ERC20Factory.connect(tokenAddress, this._Signer);
  }
}
