import { WalletInterface } from './walletInterface';
import { By, WebDriver } from 'selenium-webdriver';
import { getWindow, waitForWindow } from '../util';

export class PolkadotJs implements WalletInterface {
  // url that opens polkadot wallet for setup/importing wallets
  private extensionUrl = 'chrome-extension://mopnmbcafieddcagagdcbnhejhlodfdd/index.html#/';

  // setup objects
  private understoodBtn = By.xpath("//div[text()='Understood, let me continue']");
  private addAccountBtn = By.xpath("/html/body/div/main/div[1]/div/div[2]/div[1]");
  private importSeedBtn = By.xpath("//span[text()='Import account from pre-existing seed']");
  private seedInput = By.xpath("//label[text()='existing 12 or 24-word mnemonic seed']/following-sibling::textarea");
  private nextBtn = By.xpath("//div[text()='Next']");
  private acctDescInput = By.xpath("//label[text()='A descriptive name for your account']/following-sibling::input");
  private passwordInput = By.xpath("//input[@type='password']");
  private pswdConfirmationInput = By.xpath("//label[text()='Repeat password for verification']/following-sibling::input");
  private finishAddAccBtn = By.xpath("//div[text()='Add the account with the supplied seed']");

  // injection objects
  private allowCwBtn = By.xpath("//div[text()='Yes, allow this application access']");

  // sign txn objects
  private pswdInput = By.xpath("//label[text()='Password for this account']/following-sibling::input")
  private signMsgBtn = By.xpath("//div[text()='Sign the message']");

  async injectWallet(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, 'polkadot{.js}');
    await getWindow(driver, 'polkadot{.js}');
    await driver.findElement(this.allowCwBtn).click();
    return Promise.resolve(undefined);
  }

  async setup(driver: WebDriver): Promise<string> {
    await driver.get(this.extensionUrl);

    await driver.findElement(this.understoodBtn).click();
    await driver.findElement(this.addAccountBtn).click();
    await driver.findElement(this.importSeedBtn).click();
    await driver.findElement(this.seedInput).sendKeys(process.env.POLKADOT_JS_MNEMONIC);
    await driver.findElement(this.nextBtn).click();
    await driver.findElement(this.acctDescInput).sendKeys(process.env.POLKADOT_JS_DESC);
    await driver.findElement(this.passwordInput).sendKeys(process.env.POLKADOT_JS_PASSWORD);
    await driver.findElement(this.pswdConfirmationInput).sendKeys(process.env.POLKADOT_JS_PASSWORD);
    await driver.findElement(this.finishAddAccBtn).click();

    return Promise.resolve('');
  }

  async signTxn(driver: WebDriver): Promise<void> {
    await waitForWindow(driver, 'polkadot{.js}');
    await getWindow(driver, 'polkadot{.js}');

    await driver.findElement(this.pswdInput).sendKeys(process.env.POLKADOT_JS_PASSWORD);
    await driver.findElement(this.signMsgBtn).click();

    return Promise.resolve(undefined);
  }

}
