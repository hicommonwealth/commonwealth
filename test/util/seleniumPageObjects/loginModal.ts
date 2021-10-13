/* eslint-disable */
import { By, WebDriver } from 'selenium-webdriver';

enum WalletName {
  'Cosmos Wallet (Keplr)',
  'Terra Wallet (TerraStation)',
  'Injective MetaMask Wallet',
  'Ethereum Wallet (MetaMask)',
  'Ethereum Wallet (WalletConnect)',
  'NEAR Wallet',
  'polkadot-js',
  'Substrate (command line)'
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
  private walletBtn = By.xpath("//span[text()='Continue with Wallet']")

  // post goBtn click modal objects
  private existingWalletBtn = By.xpath("//span[text()='Yes, I have a wallet']")
  private noWalletBtn = By.xpath("//span[text()='No, generate an address for me']")


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
    // TODO: finish login flow for specific wallets
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
