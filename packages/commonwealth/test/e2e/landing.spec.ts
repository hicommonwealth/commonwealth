import { test, expect } from '@playwright/test';
import { PORT } from '../../server/config';

test('Homepage works', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  await page.locator('div').filter({ hasText: 'Why Commonwealth? Login' }).nth(2).click();
  await page.locator('#landing-page').click();
  await page.locator('#landing-page').getByRole('img', { name: 'Commonwealth' }).click();
  await page.locator('section').filter({ hasText: 'A community for every token. Commonwealth is an all-in-one platform for on-chain' }).getByRole('heading', { name: 'A community for every token.' }).click();
  await page.getByText('Commonwealth is an all-in-one platform for on-chain communities to discuss, vote').click();
  await page.getByText('A community for every token. Commonwealth is an all-in-one platform for on-chain').click();
  await page.getByRole('heading', { name: 'We’re also here' }).click();
  await page.locator('img:nth-child(3)').click();
  await page.locator('.gradient-135 > img').first().click();
  await page.locator('.gradient-135 > img:nth-child(2)').click();
  await page.getByRole('heading', { name: 'Every token, every chain' }).click();
  await page.getByText('Subscribe to chain activity like whale transfers or major votes. Discuss new ide').click();
  await page.getByRole('heading', { name: 'Token creators are empowered' }).click();
  await page.getByText('Token creators are empowered Commonwealth lets you simplify your community and g').click();
  await page.getByText('Commonwealth lets you simplify your community and governance, bringing four tool').click();
  await page.locator('#tab-codepen').click();
  await page.getByRole('button', { name: 'On-chain notifications Stay up-to-date on chain events like votes and large transfers.' }).click();
  await page.getByRole('button', { name: 'Off-chain polling & on-chain voting' }).click();
  await page.getByRole('button', { name: 'Crowdfunding' }).click();
  await page.getByRole('button', { name: 'A rich forum experience' }).click();
  await page.locator('#tab4-codepen img').click();
  await page.getByText('Token holders come together Find your community and drive your token forward. Yo').click();
  await page.getByText('Token holders come together Find your community and drive your token forward. Yo').click();
  await page.getByRole('heading', { name: 'Token holders come together' }).click();
  await page.getByText('Find your community and drive your token forward.').click();
  await page.getByText('Stop bouncing between 10 tabs at once - everything you need to know about your t').click();
  await page.getByText('We generate pages for your favorite community and address from real-time chain a').click();
  await page.getByText('Be the first to know when community events are happening with in-app, email, and').click();
  await page.getByText('Participate in events. Participate in events like upcoming votes, new projects a').click();
  await page.getByText('Participate in events like upcoming votes, new projects and community initiative').click();
  await page.getByText('Leverage on-chain crowdfunding Fund new projectsAnyone from within your communit').click();
  await page.locator('section').filter({ hasText: 'A community for every token. Join Commonwealth today.' }).getByRole('heading', { name: 'A community for every token.' }).click();
  await page.getByText('Join Commonwealth today.').click();
  await page.locator('section').filter({ hasText: 'A community for every token. Join Commonwealth today.' }).click();
  await page.locator('div').filter({ hasText: 'A community for every token. Join Commonwealth today.' }).nth(3).click();
  await page.locator('div').filter({ hasText: 'AboutBlogJobsTermsPrivacyDocsDiscordTelegram' }).nth(2).click();
  await page.getByRole('img', { name: 'Commonwealth' }).nth(1).click();
});

test('About link works', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  await page.getByText('About', { exact: true }).click();
  await page.locator('.WhyCommonwealthPage').click();
  await page
    .locator('div')
    .filter({ hasText: 'AboutBlogJobsTermsPrivacyDocsDiscordTelegram' })
    .first()
    .click();
  await page.locator('div').filter({ hasText: 'Log in' }).first().click();
  await page.locator('.SidebarQuickSwitcher').click();
});

test('blog link works', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  const page2Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Blog' }).click();
  const page2 = await page2Promise;
  await page2.getByRole('banner').click();
  await page2.getByRole('main').click();
});

test('terms link works', async ({ page }) => {
  // TODO: Broken, needs fixing
});

test('privacy link works', async ({ page }) => {
  // TODO: Broken, needs fixing
});

test('docs link works', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  const page4Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Docs' }).click();
  const page4 = await page4Promise;
  await page4.getByRole('banner').click();
  await page4.getByTestId('public.headerHomeLink').click();
  await page4
    .getByText(
      'Welcome to CommonwealthCommonwealth is an all-in-one governance platform for cry'
    )
    .click();
  await page4
    .locator('div:nth-child(2) > div > div > div > div > div > div')
    .first()
    .click();
  await page4
    .getByTestId('page.desktopTableOfContents')
    .getByText(
      'Welcome to CommonwealthProduct FeaturesCommonwealth DashboardNavigating Home Pag'
    )
    .click();
  await page4.getByRole('link', { name: 'Welcome to Commonwealth' }).click();
  await page4
    .getByTestId('page.desktopTableOfContents')
    .getByText('Commonwealth Dashboard')
    .click();
  await page4.getByRole('link', { name: 'Next Product Features' }).click();
  await page4.getByTestId('page.title').click();
  await page4
    .getByText('An overview of product features that Commonwealth offers.')
    .click();
  await page4
    .getByRole('heading', {
      name: '​ speaking head ​Crypto-Native Forum​ Direct link to heading',
    })
    .click();
  await page4
    .getByRole('link', {
      name: 'Next - Commonwealth Dashboard Navigating Home Page',
    })
    .click();
  await page4.getByTestId('page.title').click();
  await page4
    .getByRole('heading', { name: 'Home Page Layout Direct link to heading' })
    .click();
  await page4
    .locator(
      '.r-1oszu61 > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div'
    )
    .click();
  await page4
    .frameLocator('iframe')
    .getByRole('button', { name: 'Play the video' })
    .first()
    .click();
  await page4.getByTestId('page.contentEditor').locator('img').first().click();
  await page4
    .locator(
      'div:nth-child(8) > div:nth-child(2) > div > div > div > div > div > div > div'
    )
    .first()
    .press('Escape');
  await page4.getByTestId('page.contentEditor').locator('img').nth(3).click();
  await page4.goto('https://docs.commonwealth.im/commonwealth/');
});