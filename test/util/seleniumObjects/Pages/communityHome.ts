import { By, WebDriver } from 'selenium-webdriver';

export class CommunityHome {
  private accountName = By.xpath("//a[@class='user-display-name username']");

  constructor(protected driver: WebDriver) {}

  public async getAccountName(): Promise<string> {
    const nameElement = await this.driver.findElement(this.accountName);
    return nameElement.getText();
  }
}
