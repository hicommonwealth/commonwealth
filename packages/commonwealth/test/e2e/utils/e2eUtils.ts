// Note, this login will not work for the homepage
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { DATABASE_URI } from '../../../server/config';

// Logs in user for specific chain
export async function login(page, chain = 'ethereum') {
  await addUserIfNone(chain);

  await page.waitForSelector('.LoginSelector button');
  let button = await page.locator('.LoginSelector button');
  await button.click();

  await page.waitForSelector('.LoginDesktop');

  let metaMaskIcon = await page.$$("text='Metamask'");
  do {
    await page.mouse.click(0, 0);
    button = await page.locator('.LoginSelector button');
    await button.click();
    metaMaskIcon = await page.$$("text='Metamask'");
  } while (metaMaskIcon.length === 0);

  await page.getByText('Metamask').click();
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
    'SELECT url FROM "ChainNodes" WHERE eth_chain_id = 1'
  );
  if (ethChainNodeExists[0].length === 0) {
    try {
      await testDb.query(`
        INSERT INTO "ChainNodes" (id, url, eth_chain_id, alt_wallet_url, balance_type, name)
        VALUES (37, 'https://eth-mainnet.g.alchemy.com/v2/${apiKey}', 1,
         'https://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4', 'ethereum', 'Ethereum (Mainnet)');
    `);
    } catch (e) {
      console.log(e);
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
export async function addUserIfNone(chain) {
  if (chain != 'ethereum') {
    await addUserIfNone('ethereum');
  }
  const userExists = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}' AND chain = '${chain}'`
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
      '${chain}',
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
