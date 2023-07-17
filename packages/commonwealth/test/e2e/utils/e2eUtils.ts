// Note, this login will not work for the homepage
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

// This connection is used to speed up tests, so we don't need to load in all the models with the associated
// imports. This can only be used with raw sql queries.
export const testDb = new Sequelize(DATABASE_URI);

export const testAddress = '0x0bad5AA8Adf8bA82198D133F9Bb5a48A638FCe88';

// removes default user from the db. Subsequent login will need to go through the profile creation screen
export async function removeUser() {
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
  const addQuery = `
  WITH inserted_user AS (
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
      ) RETURNING id
    ),
    pr as (
    INSERT INTO "Profiles" (
      user_id,
      created_at,
      updated_at,
      profile_name,
      is_default,
      socials
    ) Select
      inserted_user.id,
      '2023-07-14 13:03:56.203-07',
      '2023-07-14 13:03:56.415-07',
      'TestAddress',
      false,
      '{}'
    from inserted_user),
    ad as (
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
    ) select
      '${testAddress}',
      'ethereum',
      '2023-07-14 13:03:55.754-07',
      '2023-07-14 13:03:56.212-07',
      (SELECT id FROM inserted_user),
      'a4934d7895bd5cd31ba5c7f5f8383689aed3',
      '2023-07-14 13:03:56.212-07',
      '2023-07-14 13:03:56.212-07',
      false,
      false,
      false,
      113877,
      'metamask',
      '{"number":17693949,"hash":"0x26664b8151811ad3a2c4fc9091d248e5105950c91b87d71ca7a1d30cfa0cbede","timestamp":1689365027}',
      false,
      'member'
    from inserted_user)
    select inserted_user.* from inserted_user;
`;

  const testQuery = await testDb.query(
    `select 1 from "Addresses" where address = '${testAddress}'`
  );
  // if the user doesn't have their address in a db, add one
  if (testQuery[0].length < 1) {
    await testDb.query(addQuery);
  }
}
