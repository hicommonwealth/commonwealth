/* eslint-disable */
import { By, WebDriver } from 'selenium-webdriver';
import { getWindow } from '../util';
import { WalletInterface } from './walletInterface';

/**
 * Takes a driver instance that has just injected/installed the MetaMask or has already installed
 */
export class MetaMask implements WalletInterface {

  // setup/wallet import objects
  private metaMaskGetStartedBtn = By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/button')
  private importWalletBtn = By.xpath("//button[text()='Import wallet']")
  private noThanksBtn = By.xpath("//button[text()='No Thanks']")
  private recoveryPhraseInput = By.className('MuiInputBase-input MuiInput-input')
  private recoveryPhrase = String(process.env.METAMASK_RECOVERY_PHRASE)
  private newPasswordOne = By.id("password")
  private newPasswordTwo = By.id("confirm-password")
  private password = String(process.env.METAMASK_PASSWORD)
  private termsCheckBox = By.xpath("//*[@id=\"app-content\"]/div/div[2]/div/div/form/div[7]/div");
  private finalImportBtn = By.xpath("//button[text()='Import']");
  private allDoneBtn = By.xpath("//button[text()='All Done']");
  private whatsNew = By.xpath(`//*[@id="popover-content"]/div/div/section/header/div/button`)

  // inject wallet objects
  private nextBtn = By.xpath("//button[text()='Next']");
  private connectBtn = By.xpath("//button[text()='Connect']");

  // sign txn objects
  private signBtn = By.xpath("//button[text()='Sign']");

  /**
   * Takes a driver instance with the MetaMask setup window and imports a wallet
   * @param driver A web driver instance with the MetaMask setup window open (not necessarily active/selected)
   */
  public async setup(driver: WebDriver) {
    await getWindow(driver, 'MetaMask');

    // import wallet process
    await driver.findElement(this.metaMaskGetStartedBtn).click();
    await driver.findElement(this.importWalletBtn).click();
    await driver.findElement(this.noThanksBtn).click();
    await driver.findElement(this.recoveryPhraseInput).sendKeys(this.recoveryPhrase)
    await driver.findElement(this.newPasswordOne).sendKeys(this.password);
    await driver.findElement(this.newPasswordTwo).sendKeys(this.password);
    await driver.findElement(this.termsCheckBox).click();
    await driver.findElement(this.finalImportBtn).click();
    await driver.findElement(this.allDoneBtn).click();
    await driver.findElement(this.whatsNew).click();

    // return to the starting blank window
    await getWindow(driver, '');

    // CANNOT CLOSE METAMASK WINDOW HERE AS IT CAUSES ERROR WHEN LOADING COMMONWEALTH.IM AFTER

    // return handle id of metamask window
    return await driver.getWindowHandle()
  }

  /**
   * Used to approve/inject the wallet instance into the current window
   * @param driver A web driver instance with the metamask extension open and ready for connect flow
   */
  public async injectWallet(driver: WebDriver) {
    await driver.findElement(this.nextBtn).click();
    await driver.findElement(this.connectBtn).click();
  }

  /**
   * Used to sign any prompted transaction
   * @param driver A driver instance that has a Metamask signing popup open AND ACTIVE
   */
  public async signTxn(driver: WebDriver) {
    await driver.findElement(this.signBtn).click();
  }
}
