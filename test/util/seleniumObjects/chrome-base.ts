/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { By, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'
import * as fs from 'fs';
import * as path from 'path';
import { MetaMask } from './wallets/metamask';
import { getWindowTitles } from './util';
import { TerraStation } from './wallets/terraStation';
import { PolkadotJs } from './wallets/polkadotJs';
import { Keplr } from './wallets/keplr';


export class BasePage {
  protected driver: WebDriver

  protected _metamask: MetaMask

  protected _terraStation: TerraStation

  protected _polkadotJs: PolkadotJs

  protected _keplr: Keplr

  /**
   * Sets all asynchronous settings like timeouts and window size. It also loads and sets up all the required chrome
   * extensions (mostly wallets).
   * @returns A dictionary containing all the extension window handles
   */
  private async init(): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000});
    await this.driver.manage().window().maximize();
    await this.driver.getWindowHandle();
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.get(url);
  }

  public async initNoExtension(): Promise<WebDriver> {
    const chromeOptions = new chrome.Options()
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("--disable-dev-shm-usage");
    chromeOptions.addArguments("--headless");
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    await this.init();
    return this.driver;
  }

  /**
   * Creates a driver instance instance with the MetaMask extension installed and properly setup (wallet imported)
   */
  public async initWithMetaMask(): Promise<WebDriver> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/MetaMask.crx'), { encoding: 'base64' })])
    // chromeOptions.addArguments("--no-sandbox");
    // chromeOptions.addArguments("--disable-dev-shm-usage");
    // chromeOptions.addArguments("--headless");
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    await this.init();

    this._metamask = new MetaMask();
    await this._metamask.setup(this.driver);
    return this.driver;
  }

  public async initWithTerraStation(): Promise<WebDriver> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/TerraStation.crx'), { encoding: 'base64' })])
    // chromeOptions.addArguments("--no-sandbox");
    // chromeOptions.addArguments("--disable-dev-shm-usage");
    // chromeOptions.addArguments("--headless");
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    await this.init();

    this._terraStation = new TerraStation();
    await this._terraStation.setup(this.driver);
    return this.driver;
  }

  public async initWithPolkadotJs(): Promise<WebDriver> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/PolkadotJS.crx'), { encoding: 'base64' })])
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("--disable-dev-shm-usage");
    chromeOptions.addArguments("--headless");
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    await this.init();

    this._polkadotJs = new PolkadotJs();
    await this._polkadotJs.setup(this.driver);
    return this.driver;
  }

  public async initWithKeplr(): Promise<WebDriver> {
    const chromeOptions = new chrome.Options().addExtensions([fs.readFileSync(path.resolve(__dirname,
      '../fixtures/ChromeExtensions/Keplr.crx'), { encoding: 'base64' })])
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("--disable-dev-shm-usage");
    chromeOptions.addArguments("--headless");
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    await this.init();

    this._keplr = new Keplr();
    await this._keplr.setup(this.driver);
    return this.driver;
  }

  public get metamask() {
    return this._metamask;
  }

  public get terraStation() {
    return this._terraStation;
  }

  public get polkadotJs() {
    return this._polkadotJs;
  }

  public get keplr() {
    return this._keplr;
  }
}
