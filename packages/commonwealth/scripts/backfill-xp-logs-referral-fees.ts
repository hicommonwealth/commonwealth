/*
 * Backfills xp logs with referral fees
 */
import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { exit } from 'process';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

async function main() {
  const feeRatio = process.argv.length > 2 ? parseFloat(process.argv[2]) : 0;
  log.info(
    `✅ Backfilling xp logs with referral fees using a fee ratio of ${feeRatio}`,
  );

  // create a backfill referral fee column if it doesn't exist
  await models.sequelize.query(`
    ALTER TABLE "XpLogs" ADD COLUMN IF NOT EXISTS backfill_referrer_user_id INT;
    ALTER TABLE "XpLogs" ADD COLUMN IF NOT EXISTS backfill_referrer_xp_points INT;
    ALTER TABLE "XpLogs" ADD COLUMN IF NOT EXISTS backfill_is_referral_event BOOLEAN;
  `);

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
  m.event_name,
  CASE WHEN m.reward_amount > 0 THEN m.reward_amount * COALESCE(m.amount_multiplier, 1) ELSE xl.xp_points END as reward_amount,
  CASE WHEN m.event_name IN ('SignUpFlowCompleted', 'CommunityCreated', 'CommunityJoined') THEN TRUE ELSE FALSE END as is_referral_event,
  coalesce(m.creator_reward_weight, 0) as creator_reward_weight,
  xl.user_id,
  xl.creator_user_id,
  xl.referrer_user_id,
  xl.referrer_xp_points,
  u.referred_by_address,
  ref_user.*
FROM
  "XpLogs" xl
  JOIN "QuestActionMetas" m ON xl.action_meta_id = m.id
  JOIN "Users" u ON u.id = xl.user_id
  LEFT JOIN LATERAL (
    SELECT DISTINCT ON (a.address)
      r.id AS confirmed_referrer_user_id,
      r.profile->>'name' AS referrer_name
    FROM
      "Addresses" a
      JOIN "Users" r ON a.user_id = r.id
    WHERE
      a.address = u.referred_by_address -- TODO: do we need case-insensitive matching?
      AND r.tier > 1 AND a.is_banned = FALSE -- make sure referrer is not a banned user
    ORDER BY
      a.address, r.id -- pick "first" match by r.id
  ) AS ref_user ON true
WHERE
  u.referred_by_address IS NOT NULL -- always review referrers by looking at the users referred by address column (driver)
  AND xl.id > :lastId
ORDER BY
  xl.id
LIMIT ${batchSize}
),
updated as ( -- update backfill columns with correct values
  UPDATE "XpLogs" xl
  SET
    backfill_referrer_user_id = l.confirmed_referrer_user_id,
    backfill_referrer_xp_points = CASE
      WHEN l.confirmed_referrer_user_id IS NULL THEN NULL -- no referrer found
      WHEN l.is_referral_event = TRUE THEN l.reward_amount * l.creator_reward_weight
      ELSE l.reward_amount * :feeRatio 
    END,
    backfill_is_referral_event = l.is_referral_event
  FROM l
  WHERE xl.id = l.log_id
  RETURNING id
)
SELECT COUNT(*)::INT AS count, COALESCE(MAX(id), :lastId)::INT AS max_id FROM updated;
`,
      { replacements: { lastId, feeRatio }, type: QueryTypes.SELECT },
    );
    if (rows.length === 0) break;
    count = rows[0].count;
    lastId = rows[0].max_id;
    total += count;
    log.info(`Updated ${count} rows at ${lastId}...`);
  } while (count > 0);

  log.info(`✅ Backfill completed with ${total} updated rows!`);
  exit(0);
}

main().catch((err) => {
  log.error(err);
  exit(1);
});
