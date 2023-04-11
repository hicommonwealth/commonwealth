import { test, expect } from '@playwright/test';
import { PORT } from '../../server/config';

test.describe('Community proposals page', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  // Using same tests for both gov modules, so extracted first:
  const headerTest = async ({ page }) => {
    const activeHeader = await page
      .locator('.Text.h3.semiBold')
      .filter({ hasText: 'Active' })
      .first();
    const innerText = await activeHeader.innerText();
    expect(innerText).toEqual('Active');
  };

  const inactiveProposalCardsTest = async ({ page }, expectedMinimumCount) => {
    const inactiveCardsContainer = await page
      .locator('.CardsCollection .cards')
      .nth(1);
    await page.waitForSelector('.ProposalCard', {
      timeout: 60000,
      strict: false,
    });
    const cardCount = await inactiveCardsContainer
      .locator('.ProposalCard')
      .count();
    await expect(cardCount).toBeGreaterThanOrEqual(expectedMinimumCount);
  };

  const inactiveProposalPageTest = async ({ page }) => {
    const inactiveCardsContainer = await page
      .locator('.CardsCollection .cards')
      .nth(1);

    const firstCard = await inactiveCardsContainer
      .locator('.ProposalCard')
      .first();

    const title = await firstCard
      .locator('.Text.b1.semiBold.noWrap')
      .first()
      .innerText();

    const navigationPromise = page.waitForNavigation();
    firstCard.click();

    await navigationPromise;
    await page.waitForSelector('.ContentPage', {
      timeout: 60000,
    });
    const content = await page.locator('.main-body-container');

    const headerText = await content.locator('.header .h3').innerText();
    const statusText = await content
      .locator('.onchain-status-text')
      .innerText();
    const description = await content
      .locator('.MarkdownFormattedText')
      .innerHTML();
    const voteResult = await content.locator('.VotingResult').innerHTML();

    expect(headerText).toEqual(title);
    expect(statusText).toBeDefined();
    expect(description).toBeDefined();
    expect(voteResult).toBeDefined();
  };

  // now the test runs:
  test.describe('kyve (gov v1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${PORT}/kyve/proposals`);
    });
    test('Active header loads', headerTest);
    test('Inactive proposal cards load', ({ page }) =>
      inactiveProposalCardsTest({ page }, 2)); // as of commit, should never be less than 2
    test('Inactive proposal page loads', inactiveProposalPageTest);
  });
  test.describe('osmosis (gov v1beta1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${PORT}/osmosis/proposals`);
    });
    test('Active header loads', headerTest);
    test('Inactive proposal cards load', ({ page }) =>
      inactiveProposalCardsTest({ page }, 412)); // as of commit, should never be less than 412
    test('Inactive proposal page loads', inactiveProposalPageTest);
  });
});
