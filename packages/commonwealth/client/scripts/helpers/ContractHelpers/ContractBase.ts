import { ChainBase } from '@hicommonwealth/core';
import IWebWallet from 'client/scripts/models/IWebWallet';
import WebWalletController from 'controllers/app/web_wallets';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

abstract class ContractBase {
  protected contract;
  public contractAddress;
  protected wallet: IWebWallet<any>;
  protected web3: Web3;
  protected initialized: boolean;
  private abi;

  constructor(contractAddress: string, abi: any) {
    this.contractAddress = contractAddress;
    this.abi = abi;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        this.wallet = WebWalletController.Instance.availableWallets(
          ChainBase.Ethereum,
        )[0];

        if (!this.wallet.api) {
          await this.wallet.enable();
        }

        this.web3 = new Web3(this.wallet.api.givenProvider);
        this.contract = new this.web3.eth.Contract(
          this.abi as AbiItem[],
          this.contractAddress,
        );
        this.initialized = true;
      } catch (error) {
        throw new Error('Failed to initialize contract: ' + error);
      }
    }
  }

  isInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Contract not initialzed. Call Contract.initialize() first.',
      );
    }
  }

  protected toBN(number: string | number) {
    return this.web3.utils.toBN(number);
  }
}

export default ContractBase;
