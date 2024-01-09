// Note, this login will not work for the homepage
import { expect } from '@playwright/test';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { DATABASE_URI } from '../../../server/config';

// Logs in user for specific chain
export async function login(page) {
  let button;

  // wait for login button and login modal to appear
  await expect(async () => {
    await expect(page.locator('.LoginSelector button')).toBeVisible();
    button = await page.locator('.LoginSelector button');
    await button.click();
    await expect(page.locator('.LoginDesktop')).toBeVisible();
  }).toPass();

  // Basic idea is that we lazily load the metamask mock (otherwise it will include ethereum to our initial bundle)
  // As a result, the metamask button will not appear right away, because the lazy loading is initialized on login screen
  // Therefore we need to re-open the login screen a few times waiting for it to finish lazy loading.
  await expect(async () => {
    await page.mouse.click(0, 0);
    button = await page.locator('.LoginSelector button');
    await button.click();
    await expect(page.locator("text='Metamask'")).toBeVisible({ timeout: 100 });
    await page.locator("text='Metamask'").click();
    await expect(page.locator('.LoginDesktop')).toHaveCount(0, {
      timeout: 10000,
    });
  }).toPass();
}

// This connection is used to speed up tests, so we don't need to load in all the models with the associated
// imports. This can only be used with raw sql queries.
export const testDb = new Sequelize(DATABASE_URI, { logging: false });

export const testAddress = '0x0bad5AA8Adf8bA82198D133F9Bb5a48A638FCe88';

export async function addAlchemyKey() {
  const apiKey = process.env.ETH_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw Error('ETH_ALCHEMY_API_KEY not found');
  }

  // If chainNode for eth doesn't exist, add it and add key.
  const ethChainNodeExists = await testDb.query(
    'SELECT url FROM "ChainNodes" WHERE eth_chain_id = 1 OR id = 37',
  );
  const polygonChainNodeExists = await testDb.query(
    'SELECT url FROM "ChainNodes" WHERE eth_chain_id = 137 OR id = 56',
  );
  if (ethChainNodeExists[0].length === 0) {
    try {
      await testDb.query(`
        INSERT INTO "ChainNodes" (id, url, eth_chain_id, alt_wallet_url, balance_type, name)
        VALUES (37, 'https://eth-mainnet.g.alchemy.com/v2/${apiKey}', 1,
         'https://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4', 'ethereum', 'Ethereum (Mainnet)');
    `);
    } catch (e) {
      console.log('ethChainNodeExists ERROR: ', e);
    }

    if (polygonChainNodeExists[0].length === 0) {
      try {
        await testDb.query(`
        INSERT INTO "ChainNodes" (id, url, eth_chain_id, alt_wallet_url, balance_type, name)
        VALUES (56, 'https://polygon-mainnet.g.alchemy.com/v2/5yLkuoKshDbUJdebSAQgmQUPtqLe3LO8', 137,
        'https://polygon-mainnet.g.alchemy.com/v2/5yLkuoKshDbUJdebSAQgmQUPtqLe3LO8', 'ethereum', 'Polygon');
    `);
      } catch (e) {
        console.log('polygonChainNodeExists ERROR: ', e);
      }
    }

    return;
  }

  // If ethChainNode already has the apiKey, early return
  if (ethChainNodeExists[0][0]['url'].includes(apiKey)) {
    return;
  }

  // If it does exist, update the key
  await testDb.query(`
  UPDATE "ChainNodes"
  SET
    url = 'https://eth-mainnet.g.alchemy.com/v2/${apiKey}',
    alt_wallet_url = 'https://eth-mainnet.g.alchemy.com/v2/${apiKey}'
  WHERE
    eth_chain_id = 1
    AND NOT EXISTS (select 1 from "ChainNodes" where url = 'https://eth-mainnet.g.alchemy.com/v2/${apiKey}')
  `);
}

// removes default user from the db. Subsequent login will need to go through the profile creation screen
export async function removeUser() {
  const userExists = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}'`,
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

export async function createAddress(chain, profileId, userId) {
  await testDb.query(`
    INSERT INTO "Addresses" (
      address,
      community_id,
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
      '${chain}',
      '2023-07-14 13:03:55.754-07',
      '2023-07-14 13:03:56.212-07',
      ${userId},
      'a4934d7895bd5cd31ba5c7f5f8383689aed3',
      '2023-07-14 13:03:56.212-07',
      '2023-07-14 13:03:56.212-07',
      false,
      false,
      false,
      ${profileId},
      'metamask',
      '{"number":17693949,"hash":"0x26664b8151811ad3a2c4fc9091d248e5105950c91b87d71ca7a1d30cfa0cbede", "timestamp":1689365027}',
      false,
      'member'
    ) ON CONFLICT DO NOTHING
  `);
}

export async function createInitialUser() {
  const userExists = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}' and community_id = 'ethereum'`,
  );

  if (userExists[0].length > 0) return;

  const userId = await testDb.query(`
  INSERT INTO "Users" (
        email,
        created_at,
        updated_at,
        "isAdmin",
        "disableRichText",
        "emailVerified",
        selected_community_id,
        "emailNotificationInterval"
      ) VALUES (
        NULL,
        '2023-07-14 13:03:56.196-07',
        '2023-07-14 13:03:56.196-07',
        false,
        false,
        false,
        NULL,
        'never'
      ) RETURNING id`);

  const profileId = (
    await testDb.query(`
    INSERT INTO "Profiles" (
        user_id,
        created_at,
        updated_at,
        profile_name,
        socials
      ) VALUES (
        ${userId[0][0]['id']},
        '2023-07-14 13:03:56.203-07',
        '2023-07-14 13:03:56.415-07',
        'TestAddress',
        '{}'
      ) RETURNING id
    `)
  )[0][0]['id'];

  await createAddress('ethereum', profileId, userId[0][0]['id']);
}

// adds user if it doesn't exist. Subsequent login will not need to go through the profile creation screen
export async function addAddressIfNone(chain) {
  const addresses = await testDb.query(
    `select * from "Addresses" where address = '${testAddress}'`,
  );

  // address already exists
  if (addresses[0].some((u) => u['chain'] === chain)) return;

  await createAddress(
    chain,
    addresses[0][0]['profile_id'],
    addresses[0][0]['user_id'],
  );
}
