/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

export const getAllCommunities = async (driver) => {
  // console.log('Starting getAllCommunities');
  try {
    const community = await driver.findElements(webdriver.By.className('communities'));
    const elts = await community[0].findElements(webdriver.By.className('home-card'));
    const eltDetails = await Promise.all(elts.map(async (elt) => {
      const text = await elt.getText();
      const id = await elt.getId();
      return { text, id };
    }));
    return { elts, eltDetails };
  } catch (error) {
    // console.log(error);
    return await getAllCommunities(driver);
  }
};

export const clickIntoCommunity = async (driver, identifyingText) => {
  // console.log('Starting clickIntoCommunity:', identifyingText);
  try {
    const homeElt = (await driver.findElements(webdriver.By.className('header-logo')))[0];
    await homeElt.click();
    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('communities')), 5000);
    const { elts } = await getAllCommunities(driver);
    for (let index = 0; index < elts.length; index++) {
      const element = elts[index];
      const text = await element.getText();
      if (text.toLowerCase() === identifyingText.toLowerCase()) {
        await element.click();
        await driver.wait(webdriver.until.elementLocated(webdriver.By.className('ChainStatusIndicator')), 5000);
        break;
      }
    }
  } catch (error) {
    return await clickIntoCommunity(driver, identifyingText);
  }
};

export const clickIntoAllChains = async (driver, chains) => {
  // console.log('Starting runThroughFlows:', identifier);
  const { elts, eltDetails } = await getAllCommunities(driver);
  let eelts = elts;
  const seenText = [];
  while (seenText.length < chains.length) {
    for (let index = 0; index < eelts.length; index++) {
      const element = eelts[index];
      const text = await element.getText();
      const communityTitle = text.split('\n')[0];
      if (chains.includes(communityTitle.toLowerCase())) {
        if (!seenText.includes(text)) {
          seenText.push(text);
          await element.click();
          await driver.wait(webdriver.until.elementLocated(webdriver.By.className('ChainStatusIndicator')), 5000);
          const image = await driver.takeScreenshot();
          fs.writeFileSync(`output/${communityTitle}-1-homepage.png`, image, 'base64');
          const homeElt = (await driver.findElements(webdriver.By.className('header-logo')))[0];
          await homeElt.click();
          await driver.wait(webdriver.until.elementLocated(webdriver.By.className('communities')), 5000);
          break;
        }
      }
    }

    eelts = await driver.findElements(webdriver.By.className('home-card'));
  }
};

export const setupDriver = () => {
  // console.log('Setting up headless browser driver');
  const builder = new webdriver.Builder().forBrowser('chrome');
  const chromeOptions = new chrome.Options();
  const defaultChromeFlags = [
    '--headless',
    '--disable-gpu',
    '--window-size=1280x1696', // Letter size
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--homedir=/tmp',
    '--single-process',
    '--data-path=/tmp/data-path',
    '--disk-cache-dir=/tmp/cache-dir',
    '--user-data-dir=/tmp/user-data',
    '--hide-scrollbars',
    '--log-level=0',
    '--v=99',
    '--ignore-certificate-errors',
  ];

  chromeOptions.addArguments(defaultChromeFlags);
  builder.setChromeOptions(chromeOptions);

  const driver = builder
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();
  return driver;
};
