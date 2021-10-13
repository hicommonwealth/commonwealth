/* eslint-disable */
import { BasePage } from '../base';
import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import * as webdriver from 'selenium-webdriver';

export class HomePage extends BasePage {
  private whyCW = By.linkText('Why Commonwealth?');
  private loginBtn = By.xpath('//*[@id="landing-page"]/nav/ul/li[2]/a');
  private tokenInput = By.id('token-input');
  private tokenInputBtn = By.id('/html/body/div/div/section[1]/div/div/div[1]/div/div[1]/button');
  private discordBtn = By.xpath('/html/body/div/div/section[1]/div/div/div[1]/div/div[2]/div/a[1]/img');
  private telegramBtn = By.xpath('/html/body/div/div/section[1]/div/div/div[1]/div/div[2]/div/a[2]/img');
  private twitterBtn = By.xpath('/html/body/div/div/section[1]/div/div/div[1]/div/div[2]/div/a[3]/img');
  private communitySlide = By.xpath('/html/body/div/div/section[2]/div[2]/div/div/ul');

  constructor() {
    super();
  }

  public async loadPage(): Promise<WebDriver> {
    await this.go_to_url('https://www.commonwealth.im')
    return this.driver
  }

  public async loadWhyCW(): Promise<WebDriver> {
    await this.driver.findElement(this.whyCW).click()
    return this.driver
  }

  /**
   * Clicks on the discord icon and switches to the new tab that opens
   */
  public async loadDiscord(): Promise<WebDriver> {
    await this.driver.findElement(this.discordBtn).click()
    const tabs = await this.driver.getAllWindowHandles()
    await this.driver.switchTo().window(tabs[1])
    return this.driver
  }

  public async loadTelegram(): Promise<WebDriver> {
    await this.driver.findElement(this.telegramBtn).click()
    const tabs = await this.driver.getAllWindowHandles()
    await this.driver.switchTo().window(tabs[1])
    return this.driver
  }

  public async loadTwitter(): Promise<WebDriver> {
    await this.driver.findElement(this.twitterBtn).click()
    const tabs = await this.driver.getAllWindowHandles()
    await this.driver.switchTo().window(tabs[1])
    return this.driver
  }

  public async useTokenInput(token: string): Promise<WebDriver> {
    await this.driver.findElement(this.tokenInput).sendKeys(token);
    await this.driver.findElement(this.tokenInputBtn).click();
    return this.driver;
  }

  public async startLogin(): Promise<WebDriver> {
    await this.driver.findElement(this.loginBtn).click();
    return this.driver;
  }

}
