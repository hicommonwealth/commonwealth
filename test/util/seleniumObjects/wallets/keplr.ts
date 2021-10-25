import { WalletInterface } from './walletInterface';
import { By, WebDriver } from 'selenium-webdriver';

export class Keplr implements WalletInterface {
  // setup wallet objects
  private registrationUrl = 'chrome-extension://dmkamcknogkgcdfhhbddcghachkejeap/popup.html#/register'
  private mnemonicInput = By.xpath("//textarea[@name='words']");
  private accNameInput = By.xpath("//input[@name='name']");
  private nextBtn = By.xpath("//buttton[text()='Next']");
  private doneBtn = By.xpath("//button[text()='Done']");

  async injectWallet(driver: WebDriver): Promise<void> {
    return Promise.resolve(undefined);
  }

  async setup(driver: WebDriver): Promise<string> {
    await driver.get(this.registrationUrl);

    await driver.findElement(this.mnemonicInput).sendKeys(process.env.KEPLR_MNEMONIC);
    await driver.findElement(this.accNameInput).sendKeys(process.env.KEPLR_ACCOUNT_NAME);
    await driver.findElement(this.nextBtn).click();
    await driver.findElement(this.doneBtn).click();

    return Promise.resolve('');
  }

  async signTxn(driver: WebDriver): Promise<void> {
    return Promise.resolve(undefined);
  }

}
