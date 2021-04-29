import { Web3Provider, AsyncSendable } from 'ethers/providers';
import { ethers, Contract, ContractFactory, Signer } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';

class ContractApi<ContractT extends Contract> {
  public readonly gasLimit: number = 3000000;

  private _contractAddress: string;
  private _Contract: ContractT;
  private _Provider: Web3Provider;
  private _tokenContract: Erc20;

  public get contractAddress() { return this._contractAddress; }
  public get Contract(): ContractT { return this._Contract; }
  public get Provider(): Web3Provider { return this._Provider; }
  public get tokenContract() { return this._tokenContract; }

  constructor(factory: ContractFactory, contractAddress: string, web3Provider: AsyncSendable) {
    this._contractAddress = contractAddress.toLowerCase();
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Contract = factory.attach(contractAddress) as ContractT;
  }

  public attachSigner(sender: string, signer?: Signer): void {
    if (!signer) {
      signer = this._Provider.getSigner(sender);
      if (!signer) {
        throw new Error('Could not get signer.');
      }
    }
    this._Contract.connect(signer);
  }

  public async init(tokenAddress?: string): Promise<void> {
    if (tokenAddress) {
      this._tokenContract = Erc20Factory.connect(tokenAddress, this._Provider);
    }
  }
}

export default ContractApi;
