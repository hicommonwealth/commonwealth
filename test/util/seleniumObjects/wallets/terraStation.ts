import { WebDriver } from 'selenium-webdriver';
import { WalletInterface } from './walletInterface';

export class TerraStation implements WalletInterface {
  setup(driver: WebDriver): Promise<string> {
    return Promise.resolve('');
  }

  injectWallet(driver: WebDriver): Promise<void> {
    return Promise.resolve(undefined);
  }

  signTxn(driver: WebDriver): Promise<void> {
    return Promise.resolve(undefined);
  }
}
