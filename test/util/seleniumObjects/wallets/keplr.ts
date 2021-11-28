import { WalletInterface } from './walletInterface';
import { By, WebDriver } from 'selenium-webdriver';
import { getWindow, waitForWindow } from '../util';

export class Keplr implements WalletInterface {
  // setup wallet objects
  private registrationUrl = 'chrome-extension://dmkamcknogkgcdfhhbddcghachkejeap/popup.html#/register'
  private importAccBtn = By.xpath("//button[text()='Import existing account']");
  private mnemonicInput = By.xpath("//textarea[@name='words']");
  private accNameInput = By.xpath("//input[@name='name']");
  private passwordInput = By.xpath("//input[@name='password']");
  private confPassInput = By.xpath("//input[@name='confirmPassword']");
  private nextBtn = By.xpath("//button[text()='Next']");
  private doneBtn = By.xpath("//button[text()='Done']");

  // inject wallet objects
  private approveBtn = By.xpath("//button[text()='Approve']");

  // sign txn objects


  async injectWallet(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Keplr']);
    await getWindow(driver, 'Keplr');

    await driver.findElement(this.approveBtn).click();

    return Promise.resolve(undefined);
  }

  async setup(driver: WebDriver): Promise<string> {
    await driver.switchTo().newWindow('Keplr');
    await driver.get(this.registrationUrl);

    await driver.findElement(this.importAccBtn).click();
    await driver.findElement(this.mnemonicInput).sendKeys(process.env.KEPLR_MNEMONIC);
    await driver.findElement(this.accNameInput).sendKeys(process.env.KEPLR_ACCOUNT_NAME);
    await driver.findElement(this.passwordInput).sendKeys(process.env.KEPLR_PASSWORD);
    await driver.findElement(this.confPassInput).sendKeys(process.env.KEPLR_PASSWORD);
    await driver.findElement(this.nextBtn).click();

    // wait for new url/redirect to load
    await driver.wait(async () => {
      const obj = await driver.findElement(this.doneBtn);
      return !!obj;
    }, 10000)

    // await driver.findElement(this.doneBtn).click();

    return Promise.resolve('');
  }

  async signTxn(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Keplr']);
    await getWindow(driver, 'Keplr')

    await driver.findElement(this.approveBtn).click();
    return Promise.resolve(undefined);
  }

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
