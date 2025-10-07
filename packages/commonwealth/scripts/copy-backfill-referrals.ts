/*
 * Copy backfilled xp logs
 */
import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { exit } from 'process';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

async function main() {
  log.info(`✅ Copying backfilled xp logs with referral fees`);
  const batchSize = 50_000;
  let lastId = 0,
    count = 0,
    total = 0;
  do {
    const rows = await models.sequelize.query<{
      count: number;
      max_id: number;
    }>(
      `
WITH l AS (
SELECT 
  xl.id AS log_id,
  xl.backfill_referrer_user_id,
  xl.backfill_referrer_xp_points
FROM
  "XpLogs" xl
WHERE
  xl.id > :lastId
  AND (xl.referrer_user_id IS NOT NULL OR xl.backfill_referrer_user_id IS NOT NULL)
ORDER BY
  xl.id
LIMIT ${batchSize}
),
updated as ( 
  UPDATE "XpLogs" xl
  SET
    referrer_user_id = l.backfill_referrer_user_id,
    referrer_xp_points = l.backfill_referrer_xp_points
  FROM l
  WHERE xl.id = l.log_id
  RETURNING id
)
SELECT COUNT(*)::INT AS count, COALESCE(MAX(id), :lastId)::INT AS max_id FROM updated;
`,
      { replacements: { lastId }, type: QueryTypes.SELECT },
    );
    if (rows.length === 0) break;
    count = rows[0].count;
    lastId = rows[0].max_id;
    total += count;
    log.info(`Updated ${count} rows at ${lastId}...`);
  } while (count > 0);

  log.info(`✅ Backfill copy completed with ${total} updated rows!`);
  exit(0);
}

main().catch((err) => {
  log.error(err);
  exit(1);
});
