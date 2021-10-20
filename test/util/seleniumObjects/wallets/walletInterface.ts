import { WebDriver } from 'selenium-webdriver';

export interface WalletInterface {
  setup(driver: WebDriver): Promise<string>;
  injectWallet(driver: WebDriver): Promise<void>;
  signTxn(driver: WebDriver): Promise<void>;
}
