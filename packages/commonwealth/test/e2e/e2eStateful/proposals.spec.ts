import { expect, test } from '@playwright/test';

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
    await collection.locator('.cards .LoadingSpinner');
    const p = await collection
      .locator('.cards .ProposalCard .proposal-card-metadata')
      .first();
    await p.waitFor({ state: 'visible', timeout: 60000 });
  };

  const allProposalCardsHaveTitles = async ({ page }) => {
    await waitForCompletedProposals({ page });
    const activeCardsContainer = await page
      .locator('.CardsCollection .cards')
      .nth(0);
    const inactiveCardsContainer = await page
      .locator('.CardsCollection .cards')
      .nth(1);

    const activeCardTitles = await activeCardsContainer
      .locator('.ProposalCard .Text.b1.semiBold.noWrap')
      .all();
    const inactiveCardTitles = await inactiveCardsContainer
      .locator('.ProposalCard .Text.b1.semiBold.noWrap')
      .all();
    const cardTitles = [...activeCardTitles, ...inactiveCardTitles];

    expect(cardTitles.length).toBeGreaterThan(0);

    for (const title of cardTitles) {
      await title.waitFor({ state: 'visible', timeout: 60000 });
      const titleText = await title.innerText();
      expect(titleText).toBeTruthy();
      expect(titleText.length).toBeGreaterThan(0);
    }
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
    await inactiveProposalPageAssertions({ page, expectedTitle: title });
  };

  const inactiveProposalPageAssertions = async ({
    page,
    expectedTitle,
  }: {
    page: any;
    expectedTitle?: string;
  }) => {
    await page.waitForSelector('.ContentPage', {
      timeout: 60000,
    });
    const content = await page.locator('.main-body-container');

    const header = await content.locator('.header .h3').first();
    const headerText = await header.innerText();
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

    expect(headerText).toBeTruthy();
    expect(headerText.length).toBeGreaterThan(0);
    if (expectedTitle) expect(headerText).toEqual(expectedTitle);
    expect(statusText).toBeTruthy();
    expect(description).toBeTruthy();
    expect(voteResult).toBeTruthy();
  };

  // now the test runs:
  test.describe('kyve (gov v1)', () => {
    const proposalsPageUrl = `http://localhost:8080/kyve/proposals`;
    test('Active header loads', async ({ page }) => {
      await page.goto(proposalsPageUrl);
      await headerTest({ page });
    });
    test('Inactive proposal cards load', async ({ page }) => {
      await page.goto(proposalsPageUrl);
      await inactiveProposalCardsTest({ page }, 5); // as of commit, should never be less than 5
    });
    test('Inactive proposal page loads from Proposal Card click', async ({
      page,
    }) => {
      await page.goto(proposalsPageUrl);
      await inactiveProposalPageTest({ page });
    });
    test('Inactive proposal page loads on direct URL', async ({ page }) => {
      await page.goto(`http://localhost:8080/kyve/proposal/5`);
      await inactiveProposalPageAssertions({ page });
    });
    test('All proposal cards have titles', async ({ page }) => {
      await page.goto(proposalsPageUrl);
      await allProposalCardsHaveTitles({ page });
    });
  });
  test.describe('osmosis (gov v1beta1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:8080/osmosis/proposals`);
    });
    test('Active header loads', headerTest);
    test('Inactive proposal cards load', ({ page }) =>
      inactiveProposalCardsTest({ page }, 79)); // as of commit, should never be less than 79
    test('Inactive proposal page loads', inactiveProposalPageTest);
    test('All proposal cards have titles', allProposalCardsHaveTitles);
  });
});
