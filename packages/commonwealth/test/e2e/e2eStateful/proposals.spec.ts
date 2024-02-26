import { models } from '@hicommonwealth/model';
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

  const closeBanner = async ({ page }) => {
    const banner = await page.$$('.Growl');
    if (banner?.[0]) {
      const closeButton = await banner[0].$('.closeButton');
      await closeButton?.click();
    }
  };

  const inactiveProposalCardsTest = async ({ page }, expectedMinimumCount) => {
    await waitForCompletedProposals({ page });
    const inactiveCardsCollection = await page.$$('.CardsCollection');
    const inactiveCardsContainer = await inactiveCardsCollection?.[1];
    const inactiveCardsSpinner = await inactiveCardsContainer?.$(
      '.LoadingSpinner',
    );
    await inactiveCardsSpinner?.waitForElementState('hidden');
    const inactiveCards = await inactiveCardsContainer?.$('.cards');

    await expect(async () => {
      const cardCount = await inactiveCards.$$eval(
        '.ProposalCard',
        (cards) => cards.length,
      );
      expect(cardCount).toBeGreaterThanOrEqual(expectedMinimumCount);
    }).toPass();
  };

  const waitForCompletedProposals = async ({ page }) => {
    // these are lazy-loaded after page init
    // await page.waitForSelector('.CardsCollection:nth-of-type(2)');
    // const collection = await page.locator('.CardsCollection:nth-of-type(2)');
    // await collection.locator('.cards .LoadingSpinner');
    // const p = await collection
    //   .locator('.cards .ProposalCard .proposal-card-metadata')
    //   .first();
    // await p.waitFor({ state: 'visible', timeout: 60000 });

    await page.waitForSelector('.CardsCollection');
    const collections = await page.$$('.CardsCollection');
    const inactive = collections[1];
    await inactive?.$('.cards .LoadingSpinner');
    await inactive?.$$('.cards .ProposalCard .proposal-card-metadata');
    const spinner = await inactive?.$('.LoadingSpinner');
    await spinner?.waitForElementState('hidden');
  };

  const waitForIpfsRequests = async ({ page }) => {
    const ipfsRe = /http:\/\/localhost:8080\/api\/ipfsProxy\?hash=*/;

    await page.waitForResponse(ipfsRe, { timeout: 10000 }).catch(() => {
      console.log('no ipfs requests');
    });
  };

  const allProposalCardsHaveTitles = async ({ page }) => {
    await waitForCompletedProposals({ page });
    const collections = await page.$$('.CardsCollection');
    const activeCardsContainer = await collections[0]?.$('.cards');
    const inactiveCardsContainer = await collections[1]?.$('.cards');

    await expect(async () => {
      const activeCardTitles = await activeCardsContainer?.$$(
        '.ProposalCard .Text.b1.semiBold.noWrap',
      );
      const inactiveCardTitles = await inactiveCardsContainer?.$$(
        '.ProposalCard .Text.b1.semiBold.noWrap',
      );

      const cardTitles = [...activeCardTitles, ...inactiveCardTitles];
      expect(cardTitles.length).toBeGreaterThan(0);

      for (const title of cardTitles) {
        const titleText = await title.innerText();
        expect(titleText).toBeTruthy();
        expect(titleText.length).toBeGreaterThan(0);
      }
    }).toPass();
  };

  const inactiveProposalPageTest = async ({ page }, isV1?: boolean) => {
    test.setTimeout(70000);
    await page.waitForSelector('.CardsCollection .cards');
    if (isV1) await waitForIpfsRequests({ page });

    await closeBanner({ page });
    await waitForCompletedProposals({ page });
    const cardsContainers = await page.$$('.CardsCollection .cards');
    const inactiveCardsContainer = await cardsContainers?.[1];

    const proposals = await inactiveCardsContainer?.$$('.ProposalCard');

    const firstProposal = proposals[proposals.length - 1];
    if (isV1) {
      await waitForIpfsRequests({ page });
      await waitForIpfsRequests({ page });
    }

    const title = await firstProposal?.$('.Text.b1.semiBold.noWrap');
    const expectedTitle = await title?.innerText();

    const navigationPromise = page.waitForNavigation();
    await firstProposal?.click({ force: true });

    await navigationPromise;
    const pageSpinner = await page.$('.LoadingSpinner');
    await pageSpinner?.waitForElementState('hidden');
    await inactiveProposalPageAssertions({ page, expectedTitle });
  };

  const inactiveProposalPageAssertions = async ({
    page,
    expectedTitle,
    isV1,
  }: {
    page: any;
    expectedTitle?: string;
    isV1?: boolean;
  }) => {
    await page.waitForSelector('.ContentPage', {
      timeout: 30000,
    });
    await closeBanner({ page });
    if (isV1) await waitForIpfsRequests({ page });

    const skeleton = await page.$(
      '.ContentPage .main-body-container .react-loading-skeleton',
    );
    await skeleton?.waitForElementState('hidden');

    const content = await page.$('.ContentPage .main-body-container');
    await content.waitForElementState('stable');

    const status = await content.$('.onchain-status-text');
    await status?.waitForElementState('visible');
    const statusText = await status?.innerText();
    const header = await content.$('.header .title');
    const headerText = await header?.innerText();
    const description = await content.$('.MarkdownFormattedText');
    const descText = await description?.innerText();
    const votingResult = await content.$('.VotingResult');
    const voteResult = await votingResult?.innerText();

    expect(headerText).toBeTruthy();
    expect(headerText.length).toBeGreaterThan(0);
    if (expectedTitle) expect(headerText).toEqual(expectedTitle);
    expect(statusText).toBeTruthy();
    expect(descText).toBeTruthy();
    expect(voteResult).toBeTruthy();
  };

  // now the test runs:
  test.describe('kyve (gov v1)', () => {
    const chain = 'kyve';
    const proposalsPageUrl = `http://localhost:8080/${chain}/proposals`;
    let originalRPCEndpoint;
    let originalRESTEndpoint;
    test.beforeAll(async () => {
      const chainNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id: chain },
      });
      originalRPCEndpoint = chainNode.url;
      originalRESTEndpoint = chainNode.alt_wallet_url;
    });
    test.describe('Using provided URL', () => {
      test('Active header loads', async ({ page }) => {
        await page.goto(proposalsPageUrl);
        await headerTest({ page });
      });
      test('Inactive proposal cards load', async ({ page }) => {
        await page.goto(proposalsPageUrl);
        await inactiveProposalCardsTest({ page }, 23); // as of commit, should never be less than 23
      });
      test('Inactive proposal page loads from Proposal Card click', async ({
        page,
      }) => {
        await page.goto(proposalsPageUrl);
        await inactiveProposalPageTest({ page }, true);
      });
      test('Inactive proposal page loads on direct URL', async ({ page }) => {
        await page.goto(`http://localhost:8080/kyve/proposal/5`);
        await inactiveProposalPageAssertions({ page, isV1: true });
      });
      test('All proposal cards have titles', async ({ page }) => {
        await page.goto(proposalsPageUrl);
        await allProposalCardsHaveTitles({ page });
      });
    });

    test.describe('Using fallback proxy', () => {
      test.describe('When chain node fails', () => {
        test.beforeAll(async () => {
          await models.ChainNode.update(
            {
              alt_wallet_url: `nonsense${Math.random()}`,
              url: `shouldfail${Math.random()}`,
            },
            { where: { cosmos_chain_id: chain } },
          );
        });
        test('Proposals load', async ({ page }) => {
          await page.goto(proposalsPageUrl);
          await inactiveProposalCardsTest({ page }, 23);
        });
        test('Inactive proposal page loads ', async ({ page }) => {
          await page.goto(`http://localhost:8080/${chain}/proposal/5`);
          await page.waitForSelector('.LoadingSpinner');
          await inactiveProposalPageAssertions({ page, isV1: true });
        });
        test.afterAll(async () => {
          await models.ChainNode.update(
            {
              url: originalRPCEndpoint,
              alt_wallet_url: originalRESTEndpoint,
            },
            { where: { cosmos_chain_id: chain } },
          );
        });
      });
    });
  });

  test.describe('stargaze (gov v1beta1)', () => {
    const chain = 'stargaze';
    const proposalsPageUrl = `http://localhost:8080/${chain}/proposals`;
    let originalRPCEndpoint;
    test.describe('Using provided URL', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(proposalsPageUrl);
      });
      test('Active header loads', headerTest);
      test('Inactive proposal cards load', ({ page }) =>
        inactiveProposalCardsTest({ page }, 200)); // as of commit, should never be less than 200
      test('Inactive proposal page loads', ({ page }) =>
        inactiveProposalPageTest({ page }));
      test('All proposal cards have titles', allProposalCardsHaveTitles);
    });

    test.describe('Using fallback proxy', () => {
      test.describe('When chain node fails', () => {
        test.beforeAll(async () => {
          await models.ChainNode.update(
            {
              alt_wallet_url: `nonsense${Math.random()}`,
              url: `shouldfail${Math.random()}`,
            },
            { where: { cosmos_chain_id: chain } },
          );
        });
        test('Proposals load', async ({ page }) => {
          await page.goto(proposalsPageUrl);
          await inactiveProposalCardsTest({ page }, 200);
        });
        test('Inactive proposal page loads ', async ({ page }) => {
          await page.goto(`http://localhost:8080/${chain}/proposal/5`);
          await page.waitForSelector('.LoadingSpinner');
          await inactiveProposalPageAssertions({ page });
        });
        test.afterAll(async () => {
          await models.ChainNode.update(
            {
              url: originalRPCEndpoint,
            },
            { where: { cosmos_chain_id: chain } },
          );
        });
      });
    });
  });
});
