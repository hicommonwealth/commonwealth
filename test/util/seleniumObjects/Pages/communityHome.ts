import { By, until, WebDriver } from 'selenium-webdriver';
import { BasePage } from '../chrome-base';

export class CommunityHome extends BasePage {
  private accountName = By.xpath("//a[@class='user-display-name username']");
  private connectChainBtn = By.xpath("//span[text()='Connect to chain']");
  private connectedChainElement = By.xpath("//div[@class='status connected']");
  protected driver: WebDriver;

  constructor(driver?: WebDriver) {
    super();
    if (driver) this.driver = driver;
  }

  public async getAccountName(): Promise<string> {
    const nameElement = await this.driver.findElement(this.accountName);
    return nameElement.getText();
  }

  public async connectToChain(): Promise<boolean> {
    await this.driver.findElement(this.connectChainBtn).click()
    try {
      await this.driver.findElement(this.connectedChainElement);
      return true;
    } catch (error) {
      return false;
    }
  }
}
