/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { By, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'
import * as fs from 'fs';
import * as path from 'path';
import { MetaMask } from './wallets/metamask';
import { getWindowTitles } from './util';
import { TerraStation } from './wallets/terraStation';


export class BasePage {
  protected driver: WebDriver

  protected _metamask: MetaMask

  protected _terraStation: TerraStation

  /**
   * Sets all asynchronous settings like timeouts and window size. It also loads and sets up all the required chrome
   * extensions (mostly wallets).
   * @returns A dictionary containing all the extension window handles
   */
  private async init(): Promise<{[key: string]: string}> {
    const handles = {}
    await this.driver.manage().setTimeouts({implicit: 10000});
    await this.driver.manage().window().maximize();
    handles['home'] = await this.driver.getWindowHandle();
    return handles;
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.driver.get(url);
  }

  /**
   * Creates a driver instance instance with the MetaMask extension installed and properly setup (wallet imported)
   */
  public async initWithMetaMask(): Promise<{[key: string]: string}> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/MetaMask.crx'), { encoding: 'base64' })])
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    const handles = await this.init();

    this._metamask = new MetaMask();
    handles['metamask'] = await this._metamask.setup(this.driver);
    return handles;
  }

  public async initWithTerraStation(): Promise<{[key: string]: string}> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/TerraStation.crx'), { encoding: 'base64' })])
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    const handles = await this.init();

    this._terraStation = new TerraStation();
    return handles;
  }

  public get metamask() {
    return this._metamask;
  }

  public get terraStation() {
    return this._terraStation;
  }
}
