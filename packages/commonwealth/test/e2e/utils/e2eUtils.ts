// Note, this login will not work for the homepage
import { TestInfo } from '@playwright/test';
import { Page } from 'playwright-test';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { DATABASE_URI } from '../../../server/config';

export async function login(page) {
  await addUserIfNone();

  await page.waitForSelector('.LoginSelector button');
  let button = await page.$('.LoginSelector button');
  await button.click();

  await page.waitForSelector('.LoginDesktop');

  let metaMaskIcon = await page.$$("text='Metamask'");
  do {
    await page.mouse.click(0, 0);
    button = await page.$('.LoginSelector button');
    await button.click();
    metaMaskIcon = await page.$$("text='Metamask'");
  } while (metaMaskIcon.length === 0);

  await page.getByText('Metamask').click();
}

export async function screenshotOnFailure(
  { page }: { page: Page },
  testInfo: TestInfo
) {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({
      name: 'screenshot',
      path: screenshotPath,
      contentType: 'image/png',
    });
    // Take the screenshot itself.
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
}

// This connection is used to speed up tests, so we don't need to load in all the models with the associated
// imports. This can only be used with raw sql queries.
export const testDb = new Sequelize(DATABASE_URI, { logging: false });

export const testAddress = '0x0bad5AA8Adf8bA82198D133F9Bb5a48A638FCe88';

export async function addAlchemyKey() {
  if (!process.env.ETH_ALCHEMY_API_KEY) {
    throw Error('ETH_ALCHEMY_API_KEY not found');
  }

  await testDb.query(`
  UPDATE "ChainNodes"
  SET 
    url = 'https://eth-mainnet.g.alchemy.com/v2/${process.env.ETH_ALCHEMY_API_KEY}',
    alt_wallet_url = 'https://eth-mainnet.g.alchemy.com/v2/${process.env.ETH_ALCHEMY_API_KEY}'
  WHERE 
    eth_chain_id = 1;
  `);
}

// removes default user from the db. Subsequent login will need to go through the profile creation screen
export async function removeUser() {
  const userExists = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}'`
  );

  if (userExists[0].length === 0) return;

  const removeQuery = `
    DELETE FROM "Subscriptions"
    WHERE subscriber_id in (
    SELECT user_id
        FROM "Addresses"
        WHERE address = '${testAddress}'
    );
    DELETE FROM "Users"
    WHERE id IN (
        SELECT user_id
        FROM "Addresses"
        WHERE address = '${testAddress}'
    );
    DELETE FROM "Profiles"
    WHERE user_id IN (
      SELECT user_id
      FROM "Addresses"
      WHERE address = '${testAddress}'
    );
    DELETE FROM "Addresses"
    WHERE address = '${testAddress}';
`;

  await testDb.query(removeQuery);
}

// adds user if it doesn't exist. Subsequent login will not need to go through the profile creation screen
export async function addUserIfNone() {
  const userExists = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}'`
  );

  if (userExists[0].length > 0) return;

  const userId = await testDb.query(`
  INSERT INTO "Users" (
        email,
        created_at,
        updated_at,
        "isAdmin",
        "disableRichText",
        "lastVisited",
        "emailVerified",
        selected_chain_id,
        "emailNotificationInterval"
      ) VALUES (
        NULL,
        '2023-07-14 13:03:56.196-07',
        '2023-07-14 13:03:56.196-07',
        false,
        false,
        '{}',
        false,
        NULL,
        'never'
      ) RETURNING id`);

  const profileId = await testDb.query(`
  INSERT INTO "Profiles" (
      user_id,
      created_at,
      updated_at,
      profile_name,
      is_default,
      socials
    ) VALUES (
      ${userId[0][0]['id']},
      '2023-07-14 13:03:56.203-07',
      '2023-07-14 13:03:56.415-07',
      'TestAddress',
      false,
      '{}'
    ) RETURNING id
  `);

  testDb.query(`
    INSERT INTO "Addresses" (
      address,
      chain,
      created_at,
      updated_at,
      user_id,
      verification_token,
      verified,
      last_active,
      is_councillor,
      is_validator,
      ghost_address,
      profile_id,
      wallet_id,
      block_info,
      is_user_default,
      role
    ) VALUES (
      '${testAddress}',
      'ethereum',
      '2023-07-14 13:03:55.754-07',
      '2023-07-14 13:03:56.212-07',
      ${userId[0][0]['id']},
      'a4934d7895bd5cd31ba5c7f5f8383689aed3',
      '2023-07-14 13:03:56.212-07',
      '2023-07-14 13:03:56.212-07',
      false,
      false,
      false,
      ${profileId[0][0]['id']},
      'metamask',
      '{"number":17693949,"hash":"0x26664b8151811ad3a2c4fc9091d248e5105950c91b87d71ca7a1d30cfa0cbede", "timestamp":1689365027}',
      false,
      'member'
    )
  `);
}
