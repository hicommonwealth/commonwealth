import { By, WebDriver } from 'selenium-webdriver';
import { BasePage } from '../chrome-base';

export class ProposalPage extends BasePage {
  private connectedChainElement = By.xpath("//div[@class='status connected']");
  private activeHeader = By.xpath("//div[text()='Active']");
  private inactiveHeader = By.xpath("//div[text()='Inactive']");
  private proposalCards = By.xpath("//div[@class='ProposalCard']")

  constructor(driver?: WebDriver) {
    super();
    if (driver) this.driver = driver;
  }

  public async loadPage(community: string): Promise<void> {
    await this.driver.get(`https://commonwealth.im/${community}/proposals`);
  }

  public async isConnectedToChain(): Promise<boolean> {
    try {
      await this.driver.findElement(this.connectedChainElement);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks whether proposals were loaded successfully. Returns true if 1 or more proposals are loaded and false if the
   * proposals fail to load or 0 proposals are loaded i.e. this returns false if everythig works but there were no
   * proposals to load in the first place.
   */
  public async isProposalsLoaded(): Promise<boolean> {
    try {
      await this.driver.findElement(this.activeHeader);
      await this.driver.findElement(this.inactiveHeader);
      const proposals = await this.driver.findElements(this.proposalCards);
      if (proposals.length > 0) return true
      return false;
    } catch (error) {
      return false;
    }
  }
}
