import { test, expect } from '@playwright/test';
import { PORT } from '../../server/config';

test('landing page works', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}`);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Commonwealth/);
  await page.locator('#landing-page').click();
  await page.locator('.flex').first().click();
  await page.locator('.gradient-135').click();
  await page.locator('.gradient-135 > img').first().click();
  await page.locator('img:nth-child(3)').click();
  await page.locator('.gradient-135 > img:nth-child(2)').click();
  await page.getByText('A community for every token.Commonwealth is an all-in-one platform for on-chain ').click();
  await page.getByText('Token creators are empoweredCommonwealth lets you simplify your community and go').click();
  await page.getByRole('button', { name: 'On-chain notifications' }).click();
  await page.getByRole('button', { name: 'Crowdfunding' }).click();
  await page.locator('#tab3-codepen img').click();
  await page.getByRole('button', { name: 'Off-chain polling & on-chain voting' }).click();
  await page.locator('#tab2-codepen img').click();
  await page.getByRole('button', { name: 'A rich forum experience' }).click();
  await page.locator('#tab4-codepen img').click();
  await page.getByText('Your community is here.Stop bouncing between 10 tabs at once - everything you ne').click();
  await page.getByText('Claim your tokenWe generate pages for your favorite community and address from r').click();
  await page.getByText('Stay updatedBe the first to know when community events are happening with in-app').click();
  await page.getByText('Participate in events. Participate in events like upcoming votes, new projects a').click();
  await page.getByText('Leverage on-chain crowdfundingFund new projectsAnyone from within your community').click();
  await page.locator('div').filter({ hasText: 'Fund new projectsAnyone from within your community can easily turn a conversatio' }).nth(3).click();
  await page.locator('div').filter({ hasText: 'Create Community EndowmentsPool funds with other like-minded folks, and fund int' }).nth(3).click();
  await page.locator('div').filter({ hasText: 'Launch New TokensUse a project to raise funds for a new DeFi token or NFT. Optio' }).nth(3).click();
  await page.locator('section').filter({ hasText: 'A community for every token.Join Commonwealth today.' }).click();
  await page.locator('div').filter({ hasText: 'AboutBlogJobsTermsPrivacyDocsDiscordTelegram' }).nth(3).click();
  await page.getByRole('img', { name: 'Commonwealth' }).nth(1).click();
});

test('About link works', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  await page.getByText('About', { exact: true }).click();
  await page.locator('.WhyCommonwealthPage').click();
  await page.locator('div').filter({ hasText: 'AboutBlogJobsTermsPrivacyDocsDiscordTelegram' }).first().click();
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
  await page4.getByText('Welcome to CommonwealthCommonwealth is an all-in-one governance platform for cry').click();
  await page4.locator('div:nth-child(2) > div > div > div > div > div > div').first().click();
  await page4.getByTestId('page.desktopTableOfContents').getByText('Welcome to CommonwealthProduct FeaturesCommonwealth DashboardNavigating Home Pag').click();
  await page4.getByRole('link', { name: 'Welcome to Commonwealth' }).click();
  await page4.getByTestId('page.desktopTableOfContents').getByText('Commonwealth Dashboard').click();
  await page4.getByRole('link', { name: 'Next Product Features' }).click();
  await page4.getByTestId('page.title').click();
  await page4.getByText('An overview of product features that Commonwealth offers.').click();
  await page4.getByRole('heading', { name: '​ speaking head ​Crypto-Native Forum​ Direct link to heading' }).click();
  await page4.getByRole('link', { name: 'Next - Commonwealth Dashboard Navigating Home Page' }).click();
  await page4.getByTestId('page.title').click();
  await page4.getByRole('heading', { name: 'Home Page Layout Direct link to heading' }).click();
  await page4.locator('.r-1oszu61 > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div').click();
  await page4.frameLocator('iframe').getByRole('button', { name: 'Play the video' }).first().click();
  await page4.getByTestId('page.contentEditor').locator('img').first().click();
  await page4.locator('div:nth-child(8) > div:nth-child(2) > div > div > div > div > div > div > div').first().press('Escape');
  await page4.getByTestId('page.contentEditor').locator('img').nth(3).click();
  await page4.goto('https://docs.commonwealth.im/commonwealth/');
});