/* eslint-disable */
import { By, WebDriver } from 'selenium-webdriver';
import { MetaMask } from '../wallets/metamask';
import { getWindow, getWindowTitles } from '../util';

export enum WalletName {
  COSMOS = 'Cosmos Wallet (Keplr)',
  TERRA = 'Terra Wallet (TerraStation)',
  INJECTIVE = 'Injective MetaMask Wallet',
  METAMASK = 'Ethereum Wallet (Metamask)',
  WALLETCONNECT = 'Ethereum Wallet (WalletConnect)',
  NEAR = 'NEAR Wallet',
  POLKADOT = 'polkadot-js',
  SUBSTRATE = 'Substrate (command line)'
}

/**
 * Takes a driver instance that has just loaded a fresh login modal and provides methods to interact with it
 */
export class LoginModal {
  protected driver: WebDriver;

  // main login modal objects
  private emailInput = By.name('email');
  private goBtn = By.xpath('/html/body/div/div[2]/div/div/div/div[2]/div/form[1]/div[2]/button/span')
  private githubBtn = By.xpath("//span[text()='Continue with Github']")
  private walletBtn = By.xpath("//span[text()='Continue with wallet']")

  // post goBtn click modal objects - email login
  private existingWalletBtn = By.xpath("//span[text()='Yes, I have a wallet']")
  private noWalletBtn = By.xpath("//span[text()='No, generate an address for me']")

  // account/address list - wallet login
  private accountItems = By.xpath("//div[@class='account-item-name']");


  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  public async connectGithub(): Promise<WebDriver> {
    await this.driver.findElement(this.githubBtn).click()
    return this.driver
  }

  /**
   * Connects the wallet specified (signs the transaction)
   * @param walletName The name of the wallet to connect (needs to match exactly with the one in the login dropdown)
   */
  public async connectWallet(walletName: WalletName): Promise<WebDriver> {
    await this.driver.findElement(this.walletBtn).click();
    await this.driver.findElement(By.xpath(`//div[text()='${walletName}']`)).click();

    // gives time for the extension notification prompt to open
    await sleep(10000);

    switch (walletName) {
      case WalletName.METAMASK:
        await getWindow(this.driver, 'MetaMask Notification');

        const metamask = new MetaMask()
        await metamask.injectWallet(this.driver);
        await getWindow(this.driver, 'Commonwealth');
        const accounts = await this.driver.findElements(this.accountItems);
        await accounts[0].click();
        await sleep(5000); // TODO: figure out non-blocking sleeps
        await getWindow(this.driver, 'MetaMask Notification');
        await metamask.signTxn(this.driver);
    }

    return this.driver
  }

  private async connectEmail(email: string): Promise<void> {
    await this.driver.findElement(this.emailInput).sendKeys(email);
    await this.driver.findElement(this.goBtn).click();
  }

  public async useEmailWithWallet(email: string): Promise<WebDriver> {
    await this.connectEmail(email);
    await this.driver.findElement(this.existingWalletBtn).click();
    // TODO: check email
    return this.driver
  }

  public async useEmailNoWallet(email: string): Promise<WebDriver> {
    await this.connectEmail(email);
    await this.driver.findElement(this.noWalletBtn).click()
    // TODO: check email
    return this.driver
  }

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
