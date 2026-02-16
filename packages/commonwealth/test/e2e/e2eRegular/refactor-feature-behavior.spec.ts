import { expect, type Page, test } from '@playwright/test';
import { loginWithMockStatus } from '../helpers/auth-helpers';
import { TEST_COMMUNITIES } from '../helpers/fixtures';
import { SELECTORS } from '../helpers/selectors';

const GUARDED_OR_NOT_FOUND_PATTERN =
  /this page is private or doesn't exist|this page doesn't exist|page not found|sign in to view or join the conversation/i;

type RouteCandidate = {
  allowGuardedState?: boolean;
  allowedFallbackUrls?: RegExp[];
  candidatePaths: string[];
  expectedSignals?: RegExp[];
  expectedUrl: RegExp;
  name: string;
};

type RouteResolution = {
  bodyText: string;
  path: string;
  url: string;
};

const waitForStableRender = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
};

const isAppErrorVisible = async (page: Page) =>
  page
    .locator(SELECTORS.error.appError)
    .first()
    .isVisible()
    .catch(() => false);

const assertNoAppError = async (page: Page) => {
  expect(await isAppErrorVisible(page)).toBeFalsy();
};

const openFirstHealthyRoute = async (
  page: Page,
  scenario: RouteCandidate,
): Promise<RouteResolution> => {
  const failures: string[] = [];

  for (const path of scenario.candidatePaths) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);

    if (await isAppErrorVisible(page)) {
      failures.push(`${path}: app-error rendered`);
      continue;
    }

    const url = page.url();
    const urlMatchesPrimary = scenario.expectedUrl.test(url);
    const urlMatchesFallback = (scenario.allowedFallbackUrls || []).some(
      (pattern) => pattern.test(url),
    );

    if (!urlMatchesPrimary && !urlMatchesFallback) {
      failures.push(`${path}: unexpected url ${url}`);
      continue;
    }

    const bodyText = await page.locator('body').innerText();

    if (GUARDED_OR_NOT_FOUND_PATTERN.test(bodyText)) {
      if (scenario.allowGuardedState) {
        return { path, url, bodyText };
      }

      failures.push(`${path}: guarded or not-found state`);
      continue;
    }

    if (
      scenario.expectedSignals &&
      !scenario.expectedSignals.some((pattern) => pattern.test(bodyText))
    ) {
      failures.push(`${path}: missing expected page signal`);
      continue;
    }

    return { path, url, bodyText };
  }

  throw new Error(
    `No candidate route passed for scenario "${scenario.name}".\n${failures.join('\n')}`,
  );
};

test.describe('Refactor feature behavior guards', () => {
  test('@refactor Quests routes support list filters and detail fallback', async ({
    page,
  }) => {
    await openFirstHealthyRoute(page, {
      name: 'Quests list route',
      candidatePaths: [
        `/${TEST_COMMUNITIES.COMMUNITY_1.id}/quests`,
        '/quests',
        '/explore?tab=quests',
      ],
      expectedUrl: /\/(cmntest\/quests|quests|explore\?tab=quests)(\/|$|\?)/i,
      expectedSignals: [/quests/i, /explore/i],
    });

    const filtersButton = page.getByRole('button', { name: /^filters$/i });
    await expect(filtersButton.first()).toBeVisible();
    await filtersButton.first().click();
    await expect(page.getByText(/quest filters/i).first()).toBeVisible();

    const detailResolution = await openFirstHealthyRoute(page, {
      name: 'Quest detail route',
      candidatePaths: [
        `/${TEST_COMMUNITIES.COMMUNITY_1.id}/quests/999999`,
        '/quests/999999',
      ],
      expectedUrl: /\/(cmntest\/quests|quests)\/\d+(\/|$|\?)/i,
      allowGuardedState: true,
      expectedSignals: [/quest details/i, /quests/i],
    });

    expect(
      /quest details|quests/i.test(detailResolution.bodyText) ||
        GUARDED_OR_NOT_FOUND_PATTERN.test(detailResolution.bodyText),
    ).toBeTruthy();
  });

  test('@refactor CreateQuest remains protected for signed-out users', async ({
    page,
  }) => {
    await page.goto('/createQuest', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    const bodyText = await page.locator('body').innerText();
    const signInVisible = await page
      .getByRole('button', { name: /sign in/i })
      .isVisible()
      .catch(() => false);

    expect(GUARDED_OR_NOT_FOUND_PATTERN.test(bodyText) || signInVisible).toBe(
      true,
    );
    await expect(page.getByText(/create a quest/i)).toHaveCount(0);
  });

  test('@refactor LaunchToken form renders and accepts token metadata inputs', async ({
    page,
  }) => {
    await page.goto('/createTokenCommunity', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    await expect(page.getByText(/launch an idea/i).first()).toBeVisible();

    const tokenNameInput = page.getByPlaceholder(/name your token/i).first();
    const tickerInput = page.getByPlaceholder('ABCD').first();

    await tokenNameInput.fill('Refactor Safety Token');
    await tickerInput.fill('RFST');

    await expect(tokenNameInput).toHaveValue('Refactor Safety Token');
    await expect(tickerInput).toHaveValue('RFST');
    await expect(page.getByRole('button', { name: /^next$/i })).toBeVisible();
  });

  test('@refactor Governance route handles active or guarded states without crashes', async ({
    page,
  }) => {
    const resolution = await openFirstHealthyRoute(page, {
      name: 'Governance route',
      candidatePaths: [
        `/${TEST_COMMUNITIES.COMMUNITY_1.id}/governance`,
        '/governance',
      ],
      expectedUrl: /\/(cmntest\/governance|governance)(\/|$|\?)/i,
      allowGuardedState: true,
      expectedSignals: [
        /governance/i,
        /connecting to chain/i,
        /wrong ethereum provider network/i,
      ],
    });

    expect(
      /governance|connecting to chain|wrong ethereum provider network/i.test(
        resolution.bodyText,
      ) || GUARDED_OR_NOT_FOUND_PATTERN.test(resolution.bodyText),
    ).toBeTruthy();
  });

  test('@refactor Wallet route supports signed-out and signed-in behaviors', async ({
    page,
  }) => {
    await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    const signedOutBodyText = await page.locator('body').innerText();
    expect(
      /login to check your common claim|wallet/i.test(signedOutBodyText),
    ).toBeTruthy();

    await loginWithMockStatus(page);

    await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    const signedInBodyText = await page.locator('body').innerText();
    expect(signedInBodyText).toMatch(/wallet/i);
    expect(signedInBodyText).toMatch(/token tx history/i);
    expect(signedInBodyText).toMatch(/referrals/i);
  });

  test('@refactor Contest public routes resolve list and detail states', async ({
    page,
  }) => {
    const listResolution = await openFirstHealthyRoute(page, {
      name: 'Contest list route',
      candidatePaths: [
        `/${TEST_COMMUNITIES.COMMUNITY_1.id}/contests`,
        '/contests',
      ],
      expectedUrl: /\/(cmntest\/contests|contests)(\/|$|\?)/i,
      allowedFallbackUrls: [
        /\/cmntest(?:$|[/?#])/i,
        /\/(?:$|[?#])/,
        /\/dashboard\/for-you(?:$|[/?#])/i,
      ],
      allowGuardedState: true,
      expectedSignals: [/contests/i, /active contests/i, /previous contests/i],
    });

    expect(
      /contests|active contests|previous contests/i.test(
        listResolution.bodyText,
      ) || GUARDED_OR_NOT_FOUND_PATTERN.test(listResolution.bodyText),
    ).toBeTruthy();

    const detailResolution = await openFirstHealthyRoute(page, {
      name: 'Contest detail route',
      candidatePaths: [
        `/${TEST_COMMUNITIES.COMMUNITY_1.id}/contests/0x0000000000000000000000000000000000000001`,
      ],
      expectedUrl: /\/cmntest\/contests\/[a-zA-Z0-9]+(\/|$|\?)/,
      allowGuardedState: true,
      expectedSignals: [/contest/i],
    });

    expect(
      /contest/i.test(detailResolution.bodyText) ||
        GUARDED_OR_NOT_FOUND_PATTERN.test(detailResolution.bodyText),
    ).toBeTruthy();
  });

  test('@refactor Leaderboard and Explore quests tab render key controls', async ({
    page,
  }) => {
    await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    await expect(page.getByText(/aura leaderboard/i)).toBeVisible();
    await expect(
      page.getByText(/leaderboards only include users level 4 and above/i),
    ).toBeVisible();

    await page.goto('/explore?tab=quests', { waitUntil: 'domcontentloaded' });
    await waitForStableRender(page);
    await assertNoAppError(page);

    await expect(page.getByText(/^explore$/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^filters$/i }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByPlaceholder(/search quests/i)
        .or(page.getByPlaceholder(/search/i)),
    ).toBeVisible();
  });
});
