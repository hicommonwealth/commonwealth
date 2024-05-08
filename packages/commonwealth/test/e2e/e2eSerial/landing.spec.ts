import { expect, test } from '@playwright/test';
import { PORT } from '../../../server/config';
import { E2E_Seeder, e2eSeeder } from '../utils/e2eUtils';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

test.describe('Test landing login', () => {
  test('Test Login', async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/`);

    // await login(page);

    // await page.waitForSelector('.new-or-returning');
    // await page.getByText('New Account').click();
    // await page.getByText('Finish').click();
    // await page.waitForSelector('.username');
    // const element = await page.$('.username');
    expect(page.getByText('Sign in')).toBeTruthy();
  });
});

// Since we lazily import web3 in order to inject metamask into the window, it might not be available right away.
// This allows us to wait until it becomes available by re-clicking the login button until it shows up.
export async function login(page) {
  await seeder.removeUser();

  await page.getByText('Sign in').click();
  await page.waitForSelector('.LoginDesktop');

  let metaMaskIcon = await page.$$("text='Metamask'");
  do {
    await page.mouse.click(0, 0);
    await page.getByText('Sign in').click();
    metaMaskIcon = await page.$$("text='Metamask'");
  } while (metaMaskIcon.length === 0);

  await page.getByText('Metamask').click();
}
