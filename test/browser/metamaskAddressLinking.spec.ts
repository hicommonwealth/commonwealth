/* eslint-disable no-unused-expressions */
require('dotenv').config();
import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import puppeteer from 'puppeteer';
import dappeteer from 'dappeteer';
console.log(dappeteer);
import { resetDatabase } from '../../server-test';

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
    console.log(dappeteer);
    browser = await dappeteer.launch(puppeteer);
    metamask = await dappeteer.getMetamask(browser);
    await metamask.importAccount(mnemonic);
  });

  it.only('should link an Ethereum address using metamask', async () => {
    const page = await browser.newPage();
    await page.goto(event.url);
  });
});
