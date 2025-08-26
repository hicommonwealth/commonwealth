/*
 * Backfills xp logs with referral fees
 */
import { logger } from '@hicommonwealth/core';
import { exit } from 'process';
import { QueryTypes } from 'sequelize';
import { models } from '../src/database';

const log = logger(import.meta);

async function main() {
  log.info('✅ Backfilling xp logs with referral fees...');

  // create a backfill referral fee column if it doesn't exist
  await models.sequelize.query(`
    ALTER TABLE "XpLogs" ADD COLUMN IF NOT EXISTS backfill_referrer_user_id INT;
    ALTER TABLE "XpLogs" ADD COLUMN IF NOT EXISTS backfill_referrer_xp_points INT;
  `);

  await models.sequelize.query(
    `
WITH l AS (
SELECT 
    xl.id AS log_id,
    m.event_name,
    m.reward_amount,
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
            u.tier > 1
            AND a.is_banned = false
            AND (
              a.address = u.referred_by_address
              OR a.address = LOWER(u.referred_by_address)
              OR a.address = UPPER(u.referred_by_address)
            )
        ORDER BY a.address, r.id  -- pick the “first” by r.id
      ) AS ref_user ON true
   WHERE
    u.referred_by_address IS NOT NULL -- we should reset logged referrers if referred_by_address is null
)
-- update backfill columns with correct values
UPDATE "XpLogs" xl
SET
	backfill_referrer_user_id = l.confirmed_referrer_user_id,
	backfill_referrer_xp_points = referrer_xp_points
WHERE
	referrer_user_id IS NOT NULL
	AND (
		coalesce(referrer_user_id,-1) <> coalesce(confirmed_referrer_user_id,-1)
		OR coalesce(referrer_xp_points,0) <> reward_amount * creator_reward_weight
	);
-- "referral" events with referrer or fee mismatch
select * from l
where
	referrer_user_id IS NOT NULL
	AND (
		coalesce(referrer_user_id,-1) <> coalesce(confirmed_referrer_user_id,-1)
		OR coalesce(referrer_xp_points,0) <> reward_amount * creator_reward_weight
	)
union
-- other events where 10% referral is due
select * from l
where
	referrer_user_id IS NULL and reward_amount >= 10 -- ?
	--referrer_xp_points = reward_amount * .1
;
      `,
    { type: QueryTypes.SELECT },
  );
  log.info('✅ Backfill completed!');
  exit(0);
}

main().catch((err) => {
  log.error(err);
  exit(1);
});
