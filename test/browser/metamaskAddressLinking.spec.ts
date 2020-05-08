/* eslint-disable no-unused-expressions */
require('dotenv').config();
import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import puppeteer from 'puppeteer';
import { resetDatabase } from '../../server-test';

const dappeteer = require('dappeteer');

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

const LOCAL = process.env.LOCAL === 'true';

describe('Browser Tests', () => {
  let event;
  let browser;
  let metamask;
  let mnemonic;

  before(async () => {
    event = { url: 'http://localhost:8080' };
    mnemonic = 'panel actual umbrella total pumpkin repeat entire virus pear panda correct early';
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output');
    }
    // reset database first
    const debug = false;
    await resetDatabase(debug);
    browser = await dappeteer.launch(puppeteer);
    metamask = await dappeteer.getMetamask(browser, { seed: mnemonic });
  });

  it.only('should link an Ethereum address using metamask', async () => {
    const page = await browser.newPage();
    await page.goto(event.url);
    const ethereumCommunityBtn = await page.$x("//a[contains(@href,'/ethereum')]");
    await ethereumCommunityBtn[0].click();
    await page.waitFor('.ChainStatusIndicator');
    await page.waitFor('.status.connected');
    await page.hover('.NavigationMenu.LoginMenu');
    await page.waitFor(5000);
    const linkWeb3 = await page.$('.login-with-web3');
    await linkWeb3.click();
    await page.waitFor('.LinkNewAddressModal');
    await page.waitFor('.link-address-option-inner');
    const loginWithMetamask = await page.$('.link-address-option-inner');
    await loginWithMetamask.click();
    const connectToExtension = await page.$('.account-adder');
    await connectToExtension.click();
    await page.waitFor(3000);
  });
});
