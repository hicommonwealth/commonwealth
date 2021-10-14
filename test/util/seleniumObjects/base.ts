/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { By, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'
import * as fs from 'fs';
import * as path from 'path';


export class BasePage {
  protected driver: WebDriver

  private tabHandles: { [key: string]: string } = {}

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

  constructor() {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname, '../fixtures/MetaMask.crx'), { encoding: 'base64' })])
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  }

  public async init(): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.setupMetaMask()
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.driver.get(url);
  }

  public async setupMetaMask(): Promise<void> {
    let tabs = await this.driver.getAllWindowHandles()
    await this.driver.switchTo().window(tabs[0])
    await this.driver.findElement(this.metaMaskGetStartedBtn).click();
    await this.driver.findElement(this.importWalletBtn).click();
    await this.driver.findElement(this.noThanksBtn).click();
    await this.driver.findElement(this.recoveryPhraseInput).sendKeys(this.recoveryPhrase)
    await this.driver.findElement(this.newPasswordOne).sendKeys(this.password);
    await this.driver.findElement(this.newPasswordTwo).sendKeys(this.password);
    await this.driver.findElement(this.termsCheckBox).click();
    await this.driver.findElement(this.finalImportBtn).click();
    await this.driver.findElement(this.allDoneBtn).click();
    await this.driver.findElement(this.whatsNew).click();
    tabs = await this.driver.getAllWindowHandles()
    this.tabHandles['metamask'] = tabs[0]
    this.tabHandles['cw'] = tabs[1]
    await this.driver.switchTo().window(tabs[1])
  }
}

// explicit wait until element shows up
// await this.driver.wait(() => {
//   this.driver.findElement(this.whatsNew).then((element) => {
//     return true
//   }).catch((error) => {
//     return false
//   })
// }, 3000)
