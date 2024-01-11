import { expect, test } from '@playwright/test';
import { PORT } from '../../../server/config';
import { waitForCondition } from '../utils/waitForCondition';

test.describe('Commonwealth Homepage', () => {
  test('Amount of bundles has not increased', async ({ page }) => {
    const loadedJsBundles = [];
    const apiCalls = [];
    // Enable network interception
    await page.route('*/**', (route) => {
      // Filter requests for JavaScript files
      const resourceType = route.request().resourceType();
      if (resourceType === 'script') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const initializerUrl = route.request()._initializer.url;
        if (initializerUrl.startsWith('http://localhost')) {
          loadedJsBundles.push(initializerUrl);
          console.log(`Loaded in bundle: ${initializerUrl}`);
        }
      } else if (resourceType === 'xhr') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const initializerUrl = route.request()._initializer.url;
        if (initializerUrl.startsWith('http://localhost')) {
          apiCalls.push(initializerUrl);
          console.log(`Made api request: ${initializerUrl}`);
        }
      }
      route.continue();
    });

    await page.goto(`http://localhost:${PORT}/`);

    await waitForCondition(() => loadedJsBundles.length >= 4, 100, 10_000);
    await page.waitForTimeout(100); // Wait for a short interval before checking again

    await waitForCondition(() => apiCalls.length >= 4, 100, 10_000);
    await page.waitForTimeout(100); // Wait for a short interval before checking again

    // This is loaded in after all other bundles are loaded in. The landing page should have 2 initial bundles and 2
    // Loaded in bundles for the page itself. If it is more, then we have accidentally added an extra bundle into the
    // build.
    const landingChunkRegex =
      /client_scripts_views_pages_landing_index_tsx\.[a-fA-F0-9]+\.chunk\.js$/;
    expect(loadedJsBundles[loadedJsBundles.length - 1]).toMatch(
      landingChunkRegex,
    );

    await page.waitForTimeout(100);
    expect(loadedJsBundles.length).toEqual(5);
    expect(apiCalls.length).toEqual(4); // domain, status, chains, nodes
  });

  test('Check Login Modal', async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/`);

    const loginButton = await page.getByText('Sign in');
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
