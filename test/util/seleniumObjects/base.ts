/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'


export class BasePage {
  protected driver: WebDriver

  constructor() {
    const chromeOptions = new chrome.Options().headless()
    this.driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.driver.get(url);
  }
}
