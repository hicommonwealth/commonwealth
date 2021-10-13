/* eslint-disable */
import * as webdriver from 'selenium-webdriver';
import { WebDriver } from 'selenium-webdriver';


export class BasePage {
  protected driver: WebDriver

  constructor() {
    this.driver = new webdriver.Builder().forBrowser('chrome').build();
  }

  public async go_to_url(url: string): Promise<void> {
    await this.driver.manage().setTimeouts({implicit: 10000})
    await this.driver.get(url);
  }
}
