// Note, this login will not work for the homepage
import {
  models,
  tester,
  type DB,
  type E2E_TestEntities,
} from '@hicommonwealth/model';
import { expect } from '@playwright/test';

export type E2E_Seeder = E2E_TestEntities & {
  testDb: DB;
  testAddress: string;
  addAlchemyKey: () => Promise<void>;
  removeUser: () => Promise<void>;
  createInitialUser: () => Promise<void>;
  addAddressIfNone: (chain: string) => Promise<void>;
};

const buildSeeder = async (): Promise<E2E_Seeder> => {
  // This connection is used to speed up tests, so we don't need to load in all the models with the associated
  // imports. This can only be used with raw sql queries.

  const testDb = models;
  const testAddress = '0x0bad5AA8Adf8bA82198D133F9Bb5a48A638FCe88';
  const e2eEntities = await tester.e2eTestEntities(testDb);

  const createAddress = async function (chain, userId) {
    const blockInfo =
      '{"number":17693949,"hash":' +
      '"0x26664b8151811ad3a2c4fc9091d248e5105950c91b87d71ca7a1d30cfa0cbede", "timestamp":1689365027}';
    await testDb.sequelize.query(`
    INSERT INTO "Addresses" (
      address,
      community_id,
      created_at,
      updated_at,
      user_id,
      verification_token,
      verified,
      last_active,
      ghost_address,
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
      'metamask',
      '${blockInfo}',
      false,
      'member'
    ) ON CONFLICT DO NOTHING
  `);
  };

  return {
    testDb,
    testAddress,
    ...e2eEntities,

    addAlchemyKey: async function () {
      // If chainNode for eth doesn't exist, add it and add key.
      const ethChainNodeExists = await testDb.sequelize.query(
        'SELECT url FROM "ChainNodes" WHERE eth_chain_id = 1 OR id = 37',
      );
      const polygonChainNodeExists = await testDb.sequelize.query(
        'SELECT url FROM "ChainNodes" WHERE eth_chain_id = 137 OR id = 56',
      );
      if (ethChainNodeExists[0].length === 0) {
        try {
          await testDb.sequelize.query(`
        INSERT INTO "ChainNodes" (id, url, eth_chain_id, alt_wallet_url, balance_type, name, created_at, updated_at)
        VALUES (37, 'https://eth-mainnet.g.alchemy.com/v2/', 1,
         'https://eth-mainnet.g.alchemy.com/v2/',
          'ethereum', 'Ethereum (Mainnet)', now(), now());
    `);
        } catch (e) {
          console.log('ethChainNodeExists ERROR: ', e);
        }

        if (polygonChainNodeExists[0].length === 0) {
          try {
            await testDb.sequelize.query(`
        INSERT INTO "ChainNodes" (id, url, eth_chain_id, alt_wallet_url, balance_type, name, created_at, updated_at)
        VALUES (56, 'https://polygon-mainnet.g.alchemy.com/v2/', 137,
        'https://polygon-mainnet.g.alchemy.com/v2/', 'ethereum',
         'Polygon', now(), now());
    `);
          } catch (e) {
            console.log('polygonChainNodeExists ERROR: ', e);
          }
        }

        return;
      }
    },

    // removes default user from the db. Subsequent login will need to go through the profile creation screen
    removeUser: async function () {
      const userExists = await testDb.sequelize.query(
        `select 1 from "Addresses" where address = '${testAddress}'`,
      );

      if (userExists[0].length === 0) return;

      const removeQuery = `
    DELETE FROM "Users"
    WHERE id IN (
        SELECT user_id
        FROM "Addresses"
        WHERE address = '${testAddress}'
    );
    DELETE FROM "Addresses"
    WHERE address = '${testAddress}';
`;

      await testDb.sequelize.query(removeQuery);
    },

    createInitialUser: async function () {
      const userExists = await testDb.sequelize.query(
        `select 1 from "Addresses" where address = '${testAddress}' and community_id = 'ethereum'`,
      );

      if (userExists[0].length > 0) return;

      const userId = await testDb.sequelize.query(`
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

      // @ts-expect-error StrictNullChecks
      await createAddress('ethereum', userId[0][0]['id']);
    },

    // adds user if it doesn't exist. Subsequent login will not need to go through the profile creation screen
    addAddressIfNone: async function (chain) {
      const [addresses] = await testDb.sequelize.query(
        `select * from "Addresses" where address = '${testAddress}'`,
      );

      // address already exists
      // @ts-expect-error StrictNullChecks
      if (addresses.length && addresses.some((u) => u['chain'] === chain))
        return;

      const user = e2eEntities.testUsers[0];
      await createAddress(chain, user.id);
    },
  };
};

let seeder;

/**
 * Legacy e2e seeder
 *
 * @deprecated Use `seed` from `libs/model/src/tester/seed.ts` instead
 * - Seed data is too coupled with integration seeds
 *
 * @returns e2e seeder
 */
export const e2eSeeder = async (): Promise<E2E_Seeder> => {
  if (!seeder) {
    try {
      console.log('Seeding e2e test data...');
      seeder = await buildSeeder();
      console.log('Seeding e2e test data...DONE');
    } catch (error) {
      console.error('Error seeding E2E:', error);
      throw error;
    }
  }
  return seeder;
};

// Logs in user for specific chain
export async function login(page) {
  let button;

  // wait for login button and login modal to appear
  await expect(async () => {
    await expect(page.locator('text="Sign in"')).toBeVisible();
    button = await page.locator('text="Sign in"');
    await button.click();
    await expect(page.locator('.ModalBase')).toBeVisible();
    button = await page.locator('.AuthButton');
    await button.click();
    await expect(page.locator('.MuiModal-backdrop').first()).toBeVisible();
  }).toPass();

  // Basic idea is that we lazily load the metamask mock (otherwise it will include ethereum to our initial bundle)
  // As a result, the metamask button will not appear right away, because the lazy loading is initialized on
  // login screen. Therefore, we need to re-open the login screen a few times waiting for it to finish lazy loading.
  await expect(async () => {
    await page.mouse.click(0, 0);
    await expect(page.locator('.MuiModal-backdrop').first()).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.locator('.MuiModal-backdrop').first()).not.toBeVisible();

    await expect(page.locator('text="Sign in"')).toBeVisible();
    button = await page.locator('text="Sign in"');
    await button.click();
    await expect(page.locator('.ModalBase')).toBeVisible();
    button = await page.locator('.AuthButton');
    await button.click();
    await expect(page.locator('.MuiModal-backdrop').first()).toBeVisible();

    await expect(page.locator('.ModalBase')).toBeVisible();
    await expect(page.locator("text='Metamask'")).toBeVisible();
    button = await page.locator('.AuthButton').last();
    await button.click();
    await expect(page.locator("text='Metamask'")).not.toBeVisible();
  }).toPass();
}
