import { WalletInterface } from './walletInterface';
import { By, WebDriver } from 'selenium-webdriver';
import { getWindow, waitForWindow } from '../util';

export class Phantom implements WalletInterface {
  // setup wallet objects
  private registrationUrl = 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html#/'
  private createAccBtn = By.xpath("//button[text()='Create a new wallet']");
  private passwordInput = By.xpath("//input[@name='password']");
  private confPassInput = By.xpath("//input[@name='confirmPassword']");
  private checkboxInput = By.xpath("//input[@data-testid='onboarding-form-terms-of-service-checkbox']");
  private mnemonicCheck = By.xpath("//input[@data-testid='onboarding-form-saved-secret-recovery-phrase-checkbox']");
  private privKeyInput = By.xpath("//input[@name='privKey']");
  private nextBtn = By.xpath("//button[text()='Continue']");

  // inject wallet objects
  private connectBtn = By.xpath("//button[text()='Connect']");
  private approveBtn = By.xpath("//button[text()='Approve']");

  // sign txn objects


  async injectWallet(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Phantom']);
    await getWindow(driver, 'Phantom');

    await driver.findElement(this.connectBtn).click();

    return Promise.resolve(undefined);
  }

  async setup(driver: WebDriver): Promise<string> {
    await waitForWindow(driver, ['Phantom']);

    await driver.findElement(this.createAccBtn).click();
    await driver.findElement(this.passwordInput).sendKeys(process.env.PHANTOM_PASSWORD);
    await driver.findElement(this.confPassInput).sendKeys(process.env.PHANTOM_PASSWORD);
    await driver.findElement(this.checkboxInput).click();
    await driver.findElement(this.nextBtn).click();
    await driver.findElement(this.mnemonicCheck).click();
    await driver.findElement(this.nextBtn).click();
    await driver.findElement(this.nextBtn).click();

    return Promise.resolve('');
  }

  async signTxn(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, ['Phantom']);
    await getWindow(driver, 'Phantom')

    await driver.findElement(this.approveBtn).click();
    return Promise.resolve(undefined);
  }

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
