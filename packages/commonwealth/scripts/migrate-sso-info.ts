import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import fetch from 'node-fetch';
import { QueryTypes } from 'sequelize';
import { config } from '../server/config';

const log = logger(import.meta);

function sleepRandom() {
  const ms = 1000 + Math.floor(Math.random() * 9000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!config.TWITTER.APP_BEARER_TOKEN) {
    throw new Error('Missing TWITTER.APP_BEARER_TOKEN');
  }

  const baseUrl = 'https://api.twitter.com/2/users/by?usernames=';
  const authHeader = `Bearer ${config.TWITTER.APP_BEARER_TOKEN}`;

  const addresses = await models.sequelize.query<{ oauth_username: string }>(
    `
      SELECT DISTINCT oauth_username
      FROM "Addresses"
      WHERE oauth_provider = 'twitter'
        AND oauth_username IS NOT NULL
        AND oauth_user_id IS NULL
      LIMIT 5;
    `,
    { type: QueryTypes.SELECT, raw: true },
  );

  // Batch into groups of 100
  const batchSize = 100;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses
      .slice(i, i + batchSize)
      .map((addr) => addr.oauth_username);
    if (batch.length === 0) continue;

    const url = `${baseUrl}${encodeURIComponent(batch.join(','))}`;

    try {
      log.info(
        `Fetching Twitter data for batch ${i / batchSize + 1} (${batch.length} usernames)...`,
      );
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        log.error(
          `Twitter API error: ${response.status} ${response.statusText}`,
        );
        continue;
      }

      const json = await response.json();
      const users: [string, string][] = json.data.map(
        (user: { id: string; username: string }) => [user.username, user.id],
      );
      const usernames = users.map((user) => user[0]);
      let queryCases = '';
      users.forEach(([_, userId]) => {
        queryCases += `WHEN oauth_username = ? THEN ${userId} `;
      });

      await models.sequelize.query(
        `
          UPDATE "Addresses"
          SET oauth_user_id = CASE
            ${queryCases}
            END
          WHERE oauth_username IN (?);
        `,
        {
          type: QueryTypes.UPDATE,
          raw: true,
          replacements: [...usernames, usernames],
        },
      );

      console.log(`Batch ${i / batchSize + 1} result:`, json);
    } catch (err) {
      log.error(
        `Error fetching Twitter data for batch ${i / batchSize + 1}:`,
        err,
      );
    }

    // If not the last batch, wait a random amount of time before next request
    if (i + batchSize < addresses.length) {
      await sleepRandom();
    }
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
