/* eslint-disable no-unused-expressions */
require('dotenv').config();
import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import webdriver, { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

import {
  setupDriver,
  clickIntoAllChains,
  getAllCommunities,
  clickIntoCommunity,
} from '../util/seleniumUtils';
import { resetDatabase } from '../../server-test';
import {
  getChains
} from '../util/modelUtils';
const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

const LOCAL = process.env.LOCAL === 'true';

describe('Browser Tests', () => {
  let event;
  let driver;
  before(async () => {
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output');
    }
    // reset database first
    const debug = false;
    await resetDatabase(debug);
  });

  beforeEach(async () => {
    const chromeOptions = new chrome.Options();
    const defaultChromeFlags = [ '--incognito' ];
    chromeOptions.addArguments(defaultChromeFlags);
    // setup event and driver in proper environment
    event = { url: 'http://localhost:8080', webhookUrl: process.env.WEBHOOK_URL };
    driver = (LOCAL)
      ? await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build()
      : await setupDriver();
    // hit event url
    driver.get(event.url);
  });

  afterEach(async () => {
    await driver.close();
    await driver.quit();
  });

  it('should get the title', async () => {
    const title = await driver.getTitle();
    expect(title).to.not.be.null;
  });

  it('should get all communities', async () => {
    const chains = await getChains();
    const chainNames = chains.map((chain) => chain.id);
    const communities = await getAllCommunities(driver);
    expect(communities.eltDetails).to.not.be.null;
    const chainCommunities = communities.eltDetails.filter((c) => {
      return chainNames.includes(c.text.toLowerCase());
    });
    expect(chainCommunities.length).to.equal(chains.length);
  });

  it('should click into all chains', async () => {
    const chains = await getChains();
    const chainNames = chains.map((chain) => chain.id);
    await clickIntoAllChains(driver, chainNames);
  });

  it('should click into Edgeware and ensure it is connected', async () => {
    // click into Edgeware
    await clickIntoCommunity(driver, 'edgeware');
    // wait until status indicator is connected
    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('status connected')), 5000);
  });
});
