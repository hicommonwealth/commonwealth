/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { By, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'
import * as fs from 'fs';
import * as path from 'path';
import { MetaMask } from './wallets/metamask';


export class BasePage {
  protected driver: WebDriver

  protected metamask: MetaMask

  private tabHandles: { [key: string]: string } = {}

  constructor() {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname, '../fixtures/MetaMask.crx'), { encoding: 'base64' })])
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  }

  public async init(): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000});
    this.metamask = new MetaMask();
    await this.metamask.setup(this.driver);
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.driver.get(url);
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
