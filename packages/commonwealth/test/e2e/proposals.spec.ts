import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.describe('Community proposals page', () => {
  test.beforeEach(async () => {
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
    await waitForCompletedProposals({ page });
    const inactiveCardsContainer = await page
      .locator('.CardsCollection .cards')
      .nth(1);

    const cardCount = await inactiveCardsContainer
      .locator('.ProposalCard')
      .count();
    await expect(cardCount).toBeGreaterThanOrEqual(expectedMinimumCount);
  };

  const waitForCompletedProposals = async ({ page }) => {
    // these are lazy-loaded after page init
    await page.waitForSelector('.CardsCollection:nth-of-type(2)');
    const collection = await page.locator('.CardsCollection:nth-of-type(2)');
    await collection.locator('.cards .Spinner');
    const p = await collection
      .locator('.cards .ProposalCard .proposal-card-metadata')
      .first();
    await p.waitFor({ state: 'visible', timeout: 60000 });
  };

  const inactiveProposalPageTest = async ({ page }) => {
    test.setTimeout(70000);
    await waitForCompletedProposals({ page });
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

    const headerText = await content.locator('.header .h3').first().innerText();
    const statusText = await content
      .locator('.onchain-status-text')
      .first()
      .innerText();
    const description = await content
      .locator('.MarkdownFormattedText')
      .first()
      .innerHTML();
    const voteResult = await content
      .locator('.VotingResult')
      .first()
      .innerHTML();

    expect(headerText).toEqual(title);
    expect(statusText).toBeDefined();
    expect(description).toBeDefined();
    expect(voteResult).toBeDefined();
  };

  // now the test runs:
  test.describe('kyve (gov v1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:8080/kyve/proposals`);
    });
    test('Active header loads', headerTest);
    test('Inactive proposal cards load', ({ page }) =>
      inactiveProposalCardsTest({ page }, 2)); // as of commit, should never be less than 2
    test('Inactive proposal page loads', inactiveProposalPageTest);
  });
  test.describe('juno (gov v1beta1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:8080/juno/proposals`);
    });
    test('Active header loads', headerTest);
    test('Inactive proposal cards load', ({ page }) =>
      inactiveProposalCardsTest({ page }, 79)); // as of commit, should never be less than 79
    test('Inactive proposal page loads', inactiveProposalPageTest);
  });
});
