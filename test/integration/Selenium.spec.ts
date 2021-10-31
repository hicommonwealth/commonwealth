/* eslint-disable */
// NOTE: IF YOU GET CHROMEDRIVE VERSION ERROR DO THE FOLLOWING:
// `yarn remove chromedriver` then `DETECT_CHROMEDRIVER_VERSION=true yarn add chromedriver --dev`
// NOTE: TESTS ASSUME THE ADDRESS HAS ALREADY BEEN USED TO LOGIN BEFORE I.E. NO ASKING FOR NAME, HEADLINE, OR BIO (todo?)

import { HomePage } from '../util/seleniumObjects/Pages/home';
import { CommunityHome } from '../util/seleniumObjects/Pages/communityHome';
import chai from 'chai';
import { LoginModal, WalletName } from '../util/seleniumObjects/modals/loginModal';
import { getWindow, getWindowTitles, waitForWindow } from '../util/seleniumObjects/util';

const { assert } = chai;
require('dotenv').config();

describe('Commonwealth.im Chrome Selenium Tests', function() {
  let driver, home, handles;
  describe('Wallet Login Tests', function() {
    beforeEach('start server and reset db', async function () {
      this.timeout(300000)
      // TODO: start local server and use that for selenium testing
      // create driver and load up extensions
      home = new HomePage()
      handles = null;
    })

    afterEach('close driver', async function () {
      await driver.quit()
    })


    xit('Should login with metamask', async () => {
      // creates driver with MetaMask
      handles = await home.initWithMetaMask();

      driver = await home.loadPage();
      assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Home page failed to load');

      driver = await home.startLogin()
      const loginModal = new LoginModal(driver);
      await loginModal.connectWallet(WalletName.METAMASK, home.metamask);
      await getWindow(driver, 'Commonwealth');

      // wait for new url/redirect to load
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl()
        if (url) return url.includes('commonwealth.im/ethereum');
        else return false
      }, 10000)

      assert((await driver.getCurrentUrl()).includes('commonwealth.im/ethereum/'),
        'MetaMask login flow failed to load Ethereum community page')
      const communityHome = new CommunityHome(driver);
      const accountName = await communityHome.getAccountName();
      assert(accountName === 'Tim', 'Account loaded from MetaMask is incorrect');
    }).timeout(60000)

    xit('Should login with TerraStation', async () => {
      // TODO: Switch to use extension page wallet import instead of "on login popup" to ensure consistency across tests
      // terra station does not open window upon installation so only import wallet AFTER clicking Login on commonwealth.im
      handles = await home.initWithTerraStation();
      driver = await home.loadPage();
      assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Home page failed to load');

      driver = await home.startLogin()
      const loginModal = new LoginModal(driver);
      await loginModal.connectWallet(WalletName.TERRASTATION, home.terraStation);
      await getWindow(driver, 'Commonwealth');

      // wait for new url/redirect to load
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl()
        if (url) return url.includes('commonwealth.im/terra');
        else return false
      }, 10000)

      assert((await driver.getCurrentUrl()).includes('commonwealth.im/terra/'),
        'TerraStation login flow failed to load Osmosis community page')
      const communityHome = new CommunityHome(driver);
      const accountName = await communityHome.getAccountName();
      assert(accountName === 'Tim', 'Account loaded from TerraStation is incorrect');
    }).timeout(60000)

    xit('Should login with Polkadot', async () => {
      handles = await home.initWithPolkadotJs();
      driver = await home.loadPage();
      assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Home page failed to load');

      driver = await home.startLogin()
      const loginModal = new LoginModal(driver);
      await loginModal.connectWallet(WalletName.POLKADOT, home.polkadotJs);

      await waitForWindow(driver, 'Commonwealth');
      assert((await driver.getCurrentUrl()).includes('commonwealth.im/edgeware/'),
        'PolkadotJs login flow failed to load Edgeware community page')
      const communityHome = new CommunityHome(driver);
      const accountName = await communityHome.getAccountName();
      assert(accountName === 'Tim', 'Account loaded from PolkadotJs is incorrect');
    }).timeout(60000)

    it('Should login with Keplr', async () => {
      // TODO: works intermittently due to approve button now working on injection
      driver = await home.initWithKeplr();
      driver = await home.loadPage();

      assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Home page failed to load');

      driver = await home.startLogin();
      const loginModal = new LoginModal(driver);
      await loginModal.connectWallet(WalletName.COSMOS, home.keplr);

      await waitForWindow(driver, 'Commonwealth');

      assert((await driver.getCurrentUrl()).includes('commonwealth.im/osmosis/'),
        'Keplr login flow failed to load Osmosis community page')
      const communityHome = new CommunityHome(driver);
      const accountName = await communityHome.getAccountName();
      assert(accountName === 'Tim', 'Account loaded from Keplr is incorrect');
    }).timeout(600000)
  })
  describe('Chain Loading Tests', function() {})
})

describe('Commonwealth.im Firefox Selenium Tests', function() {})
