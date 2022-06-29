/* eslint-disable */
import { By, WebDriver } from 'selenium-webdriver';
import { WalletInterface } from './walletInterface';
import { getWindow, getWindowTitles, waitForWindow } from '../util';

export class TerraStation implements WalletInterface {
  private extensionUrl = 'chrome-extension://aiifbnbfobpmeekipheeijimdpnlpgpp/index.html#/auth/import';

  // setup/import wallet objects --- OLD
  private importPrivKeyBtn = By.xpath("//h1[text()='Import private key']");
  private privKeyInput = By.id('key');
  private passwordInput = By.id('password');
  private submitBtn = By.xpath("//button[text()='Submit']");

  // inject wallet objects
  private AllowBtn = By.xpath("//button[text()='Allow']");

  async setup(driver: WebDriver): Promise<string> {
    await driver.get(this.extensionUrl);

    await driver.findElement(this.importPrivKeyBtn).click();
    await driver.findElement(this.privKeyInput).sendKeys(process.env.TERRA_STATION_PRIV_KEY);
    await driver.findElement(this.passwordInput).sendKeys(process.env.TERRA_STATION_PASSWORD);
    await driver.findElement(this.submitBtn).click();

    return Promise.resolve('');
  }

  async injectWallet(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Terra Station']);
    await getWindow(driver, 'Terra Station');

    await driver.findElement(this.AllowBtn).click();
    return Promise.resolve(undefined);
  }

  async signTxn(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Terra Station']);
    await getWindow(driver, 'Terra Station');

    return Promise.resolve(undefined);
  }
}
