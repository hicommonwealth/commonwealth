import { expect, type Page, test } from '@playwright/test';
import { TEST_COMMUNITIES } from '../helpers/fixtures';
import { SELECTORS } from '../helpers/selectors';

type ProtectedRoute = {
  forbiddenSignals: RegExp[];
  name: string;
  path: string;
};

const PROTECTED_STATE_PATTERN =
  /this page is private or doesn't exist|this page doesn't exist|sign in to view or join the conversation/i;

const PROTECTED_ROUTES: ProtectedRoute[] = [
  {
    name: 'admin panel',
    path: '/admin-panel',
    forbiddenSignals: [/create site assets/i, /site admin tasks/i],
  },
  {
    name: 'community manage profile',
    path: `/${TEST_COMMUNITIES.COMMUNITY_1.id}/manage/profile`,
    forbiddenSignals: [/manage the basic details of your community/i],
  },
  {
    name: 'community manage integrations',
    path: `/${TEST_COMMUNITIES.COMMUNITY_1.id}/manage/integrations`,
    forbiddenSignals: [
      /connect your apps to manage your community across channels/i,
    ],
  },
];

const assertProtectedRoute = async (page: Page, route: ProtectedRoute) => {
  await page.goto(route.path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const appErrorVisible = await page
    .locator(SELECTORS.error.appError)
    .first()
    .isVisible()
    .catch(() => false);
  expect(appErrorVisible).toBeFalsy();

  const bodyText = await page.locator('body').innerText();
  const signInButtonVisible = await page
    .getByRole('button', { name: /sign in/i })
    .isVisible()
    .catch(() => false);
  const redirectedTo404 = /\/404(?:$|[/?#])/i.test(page.url());

  expect(
    PROTECTED_STATE_PATTERN.test(bodyText) ||
      signInButtonVisible ||
      redirectedTo404,
  ).toBeTruthy();

  for (const forbiddenSignal of route.forbiddenSignals) {
    expect(bodyText).not.toMatch(forbiddenSignal);
  }
};

test.describe('Refactor privileged route access control', () => {
  test('@smoke @refactor signed-out user is blocked from admin-panel', async ({
    page,
  }) => {
    await assertProtectedRoute(page, PROTECTED_ROUTES[0]);
  });

  for (const route of PROTECTED_ROUTES.slice(1)) {
    test(`@refactor signed-out user is blocked from ${route.name}`, async ({
      page,
    }) => {
      await assertProtectedRoute(page, route);
    });
  }
});
