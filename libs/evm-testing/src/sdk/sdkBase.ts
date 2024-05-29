import Web3 from 'web3';
import getProvider from '../utils/getProvider';

export abstract class SdkBase {
  protected readonly web3: Web3;
  private accounts: string[] | undefined;

  constructor() {
    this.web3 = getProvider();
  }

  protected async getAccounts() {
    if (!this.accounts) {
      this.accounts = await this.web3.eth.getAccounts();
    }
    return this.accounts;
  }
}
