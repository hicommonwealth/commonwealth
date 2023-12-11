import IWebWallet from 'client/scripts/models/IWebWallet';
import WebWalletController from 'controllers/app/web_wallets';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ChainBase } from '../../../../../common-common/src/types';

abstract class ContractBase {
  protected contract;
  public contractAddress;
  protected wallet: IWebWallet<any>;
  protected web3: Web3;

  constructor(contractAddress: string, abi: any) {
    this.contractAddress = contractAddress;
    this.wallet = WebWalletController.Instance.availableWallets(
      ChainBase.Ethereum,
    )[0];

    this.wallet.enable().then(() => {
      if (!this.wallet.api) {
        throw new Error('Web3 Api Not Initialized');
      }
      this.web3 = this.wallet.api;
      this.contract = new this.web3.eth.Contract(
        abi as AbiItem[],
        contractAddress,
      );
    });
  }

  protected toBN(number: string | number) {
    return this.web3.utils.toBN(number);
  }
}

export default ContractBase;
