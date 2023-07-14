import { test } from '@playwright/test';
import { expect } from 'chai';
import { PORT } from '../../server/config';
import { login } from './utils/e2eUtils';

test.describe('Commonwealth Create Community', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/createCommunity`);
    await login(page);
  });

  test('Test create starter community', async ({ page }) => {
    const chainName = Date.now().toString();
    await page.locator('input#NameInput').fill(chainName);
    const iconField = await page.$('input[id*=Icon]');
    await iconField.type(
      'https://assets.commonwealth.im/8c3f1d15-4c21-4fc0-9ea4-6f9bd234eb62.jpg'
    );
    await page.click('button.Button.primary-blue');

    await assertAdminCapablities(page, chainName);
  });

  test('Test create erc20 community', async ({ page }) => {
    const chainName = Date.now().toString();

    await fillOutERCForm(
      page,
      'ERC20',
      '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      chainName
    );

    await assertAdminCapablities(page, chainName);
  });

  test('Test create erc721 community', async ({ page }) => {
    const chainName = Date.now().toString();

    await fillOutERCForm(
      page,
      'ERC721',
      '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      chainName
    );

    await assertAdminCapablities(page, chainName);
  });

  test('Test create Polygon community', async ({ page }) => {
    const chainName = Date.now().toString();
    await page.locator('input#NameInput').fill(chainName);
    const iconField = await page.$('input[id*=Icon]');
    await iconField.type(
      'https://assets.commonwealth.im/8c3f1d15-4c21-4fc0-9ea4-6f9bd234eb62.jpg'
    );
    await page.click('button.Button.primary-blue');

    await assertAdminCapablities(page, chainName);
  });
});

async function fillOutERCForm(page, formName, tokenContractAddress, chainName) {
  await page.getByText(formName).click();

  // populate token contract address
  const tokenContractAddressForm = await page.$('input[id*=Contract]');
  await tokenContractAddressForm.type(tokenContractAddress);
  await (await page.$('button.Button.primary-blue >> text=/Populate/')).click();

  await page.locator('input#NameInput').fill(chainName);
  const iconField = await page.$('input[id*=Icon]');
  await iconField.type(
    'https://assets.commonwealth.im/8c3f1d15-4c21-4fc0-9ea4-6f9bd234eb62.jpg'
  );
  await page.click('button.Button.primary-blue >> text=/Save/');
}

async function assertAdminCapablities(page, chainName) {
  await page.waitForNavigation({
    url: `http://localhost:${PORT}/${chainName}/discussions`,
  });

  // Assert create thread button is not disabled
  const button = await page.$('button.Button.mini-black >> text=Create Thread');
  const isDisabled = await button?.getAttribute('disabled');
  expect(isDisabled).to.be.not.true;

  // Assert that the element with the text "Admin Capabilities" exists
  expect(
    await page.isVisible('div.Text.b1.regular:has-text("Admin Capabilities")')
  ).to.be.true;
}
