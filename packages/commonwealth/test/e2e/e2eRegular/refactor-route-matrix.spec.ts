import { expect, type Page, test } from '@playwright/test';
import { TEST_COMMUNITIES } from '../helpers/fixtures';
import { SELECTORS } from '../helpers/selectors';

type RouteScenario = {
  allowDeniedOrNotFound?: boolean;
  allowedFallbackUrls?: RegExp[];
  candidatePaths: string[];
  expectedSignals: RegExp[];
  expectedUrl: RegExp;
  name: string;
};

const ACCESS_DENIED_OR_NOT_FOUND =
  /this page is private or doesn't exist|this page doesn't exist|page not found/i;

const ROUTE_SCENARIOS: RouteScenario[] = [
  {
    name: 'Quests entry resolves across route modes',
    candidatePaths: [
      `/${TEST_COMMUNITIES.COMMUNITY_1.id}/quests`,
      '/quests',
      '/explore?tab=quests',
    ],
    expectedUrl: /\/(cmntest\/quests|quests|explore\?tab=quests)(\/|$|\?)/i,
    expectedSignals: [/quests/i, /explore/i],
  },
  {
    name: 'LaunchToken entry resolves',
    candidatePaths: ['/createTokenCommunity'],
    expectedUrl: /\/createTokenCommunity(\/|$|\?)/i,
    expectedSignals: [/launch an idea/i, /launch/i],
  },
  {
    name: 'Leaderboard entry resolves',
    candidatePaths: ['/leaderboard'],
    expectedUrl: /\/leaderboard(\/|$|\?)/i,
    expectedSignals: [/aura leaderboard/i, /leaderboards only include users/i],
  },
  {
    name: 'Wallet entry resolves',
    candidatePaths: ['/wallet'],
    expectedUrl: /\/wallet(\/|$|\?)/i,
    expectedSignals: [/wallet/i, /referrals/i, /connect/i],
  },
  {
    name: 'Governance entry resolves across route modes',
    candidatePaths: [
      `/${TEST_COMMUNITIES.COMMUNITY_1.id}/governance`,
      '/governance',
    ],
    // Governance page can intentionally render guarded/not-found states
    // when chain/feature prerequisites are not met.
    allowDeniedOrNotFound: true,
    expectedUrl: /\/(cmntest\/governance|governance)(\/|$|\?)/i,
    expectedSignals: [
      /governance/i,
      /connecting to chain/i,
      /wrong ethereum provider network/i,
    ],
  },
  {
    name: 'Discussions entry resolves across route modes',
    candidatePaths: [
      `/${TEST_COMMUNITIES.COMMUNITY_1.id}/discussions`,
      '/discussions',
    ],
    // In common-domain mode, `/discussions` can redirect to `/` or dashboard.
    allowedFallbackUrls: [/\/(?:$|[?#])/, /\/dashboard\/for-you(?:$|[/?#])/i],
    expectedUrl: /\/(cmntest\/discussions|discussions)(\/|$|\?)/i,
    expectedSignals: [
      /discussions/i,
      /threads/i,
      /topics/i,
      /for you/i,
      /explore/i,
      /communities/i,
      /sign in/i,
    ],
  },
];

const collectRouteState = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const appErrorVisible = await page
    .locator(SELECTORS.error.appError)
    .first()
    .isVisible()
    .catch(() => false);
  const bodyText = await page.locator('body').innerText();

  return {
    appErrorVisible,
    bodyText,
    url: page.url(),
  };
};

test.describe('Refactor route matrix', () => {
  for (const scenario of ROUTE_SCENARIOS) {
    test(`@refactor ${scenario.name}`, async ({ page }) => {
      const failures: string[] = [];
      let resolved = false;

      for (const path of scenario.candidatePaths) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        const { appErrorVisible, bodyText, url } =
          await collectRouteState(page);

        if (appErrorVisible) {
          failures.push(`${path}: app-error rendered`);
          continue;
        }

        const urlMatchesPrimary = scenario.expectedUrl.test(url);
        const urlMatchesFallback = (scenario.allowedFallbackUrls || []).some(
          (pattern) => pattern.test(url),
        );
        if (!urlMatchesPrimary && !urlMatchesFallback) {
          failures.push(`${path}: unexpected url ${url}`);
          continue;
        }

        if (ACCESS_DENIED_OR_NOT_FOUND.test(bodyText)) {
          if (scenario.allowDeniedOrNotFound) {
            resolved = true;
            break;
          }
          failures.push(`${path}: denied/not-found state`);
          continue;
        }

        const hasSignal = scenario.expectedSignals.some((pattern) =>
          pattern.test(bodyText),
        );

        if (!hasSignal) {
          failures.push(`${path}: missing expected page signal`);
          continue;
        }

        resolved = true;
        break;
      }

      expect(
        resolved,
        `No candidate route passed for scenario "${scenario.name}".\n${failures.join('\n')}`,
      ).toBeTruthy();
    });
  }
});
