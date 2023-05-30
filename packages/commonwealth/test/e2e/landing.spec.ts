import { test, expect } from '@playwright/test';
import { PORT } from '../../server/config';

test.describe('Commonwealth Homepage', () => {
  test('Check Login Modal', async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/`);

    const loginButton = await page.getByText('Login');
    expect(loginButton).toBeTruthy();
    await loginButton.click();
    const loginModal = await page.waitForSelector('.LoginDesktop');
    expect(loginModal).toBeTruthy();
    const exit = await page.waitForSelector('.LoginDesktop .IconButton');
    expect(exit).toBeTruthy();
    await exit.click();
  });

  test('Check Find your community input', async ({ page }) => {
    const input = await page.getByPlaceholder('Find your community');
    expect(input).toBeTruthy();
  });

  test('Check "Every token, every chain" section', async ({ page }) => {
    const carousel = await page.locator('.Carousel', {
      hasText: 'Every token, every chain',
    });
    expect(carousel).toBeTruthy();
  });

  test('Check "Token creators are empowered" section', async ({ page }) => {
    const creators = await page.locator('.CreatorsGallery', {
      hasText: 'Token creators are empowered',
    });
    expect(creators).toBeTruthy();
  });

  test('Check "Token holders come together" section', async ({ page }) => {
    const creators = await page.locator('.TokenHolders', {
      hasText: 'Token holders come together',
    });
    expect(creators).toBeTruthy();
  });

  test('Check "Leverage on-chain crowdfunding" section', async ({ page }) => {
    const crowdfunding = await page.locator('.CrowdfundingGallery', {
      hasText: 'Leverage on-chain crowdfunding',
    });
    expect(crowdfunding).toBeTruthy();
  });
});

test.describe('Commonwealth Homepage - Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/`);
  });

  test('Check Why Commonwealth button', async ({ page }) => {
    const whyCommonwealthDiv = await page.getByText('Why Commonwealth?');
    console.log('whyCommonwealthDiv', whyCommonwealthDiv);
    expect(whyCommonwealthDiv).toBeTruthy();
    await whyCommonwealthDiv.click();
    await page.waitForURL(`http://localhost:${PORT}/whyCommonwealth`);
    await page.goBack();
  });

  test('Check About button', async ({ page }) => {
    const about = await page.locator('.footer-link', { hasText: 'About' });
    expect(about).toBeTruthy();
    await about.click();
    await page.waitForURL(`http://localhost:${PORT}/whyCommonwealth`);
  });

  test('Check Blog button', async ({ page, context }) => {
    const blog = await page.locator('.footer-link', { hasText: 'Blog' });

    const pagePromise = context.waitForEvent('page');

    await blog.click();

    const newPage = await pagePromise;
    await newPage.waitForURL(`https://blog.commonwealth.im`);
  });

  test('Check Terms button', async ({ page }) => {
    const terms = await page.locator('.footer-link', { hasText: 'Terms' });
    expect(terms).toBeTruthy();
    await terms.click();
    await page.waitForURL(`http://localhost:${PORT}/terms`);
  });

  test('Check Privacy button', async ({ page }) => {
    const privacy = await page.locator('.footer-link', { hasText: 'Privacy' });
    expect(privacy).toBeTruthy();
    await privacy.click();
    await page.waitForURL(`http://localhost:${PORT}/privacy`);
  });
});
