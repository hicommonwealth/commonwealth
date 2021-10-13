/* eslint-disable */
// NOTE: IF YOU GET CHROMEDRIVE VERSION ERROR DO THE FOLLOWING:
// `yarn remove chromedriver` then `DETECT_CHROMEDRIVER_VERSION=true yarn add chromedriver --dev`

// import { resetDatabase } from '../../server-test';
import { HomePage } from '../util/seleniumObjects/Pages/home';
import chai from 'chai';
const { assert } = chai;


describe('Tests the home page', function() {
  let driver;
  let home;

  before('start server and reset db', async function () {
    this.timeout(300000)
    // TODO: start local server and use that for selenium testing
  })

  after('close driver', async function () {
    await driver.quit()
  })

  beforeEach(() => {

  });
  afterEach(() => {

  })

  it('The homepage should load properly', async () => {
    home = new HomePage()
    driver = await home.loadPage();
    assert(await driver.getCurrentUrl() === 'https://commonwealth.im/', 'Page failed to load');
  })

  it('Should provide correct link to discord', async () => {
    driver = await home.loadDiscord();
    assert(await driver.getCurrentUrl() === 'https://discord.com/invite/frnQxxZG5S', 'Discord link failed');
  })
})
