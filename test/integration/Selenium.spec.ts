/* eslint-disable */
// NOTE: IF YOU GET CHROMEDRIVE VERSION ERROR DO THE FOLLOWING:
// `yarn remove chromedriver` then `DETECT_CHROMEDRIVER_VERSION=true yarn add chromedriver --dev`

import { HomePage } from '../util/seleniumObjects/Pages/home';
import { CommunityHome } from '../util/seleniumObjects/Pages/communityHome';
import chai from 'chai';
import { LoginModal, WalletName } from '../util/seleniumObjects/modals/loginModal';
import { getWindow } from '../util/seleniumObjects/util';
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
      // await driver.quit()
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

      // explicit wait until the signing metamask window opens
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

    it('Should login with TerraStation', async () => {
      // terra station does not open window upon installation so only import wallet AFTER clicking Login on commonwealth.im
      handles = await home.initWithTerraStation();
      driver = await home.loadPage();
      assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Home page failed to load');

      driver = await home.startLogin()
      const loginModal = new LoginModal(driver);
      await loginModal.connectWallet(WalletName.TERRASTATION, home.terraStation);

      // import wallet once popup opens
      handles['terraStation'] = await home.terraStation.setup(driver);
    }).timeout(60000)
  })
  describe('Chain Loading Tests', function() {})
})

describe('Commonwealth.im Firefox Selenium Tests', function() {})
