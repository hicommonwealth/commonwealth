/*
 * Splits creator and referrer columns in xp logs
 */
import { logger } from '@hicommonwealth/core';
import { exit } from 'process';
import { QueryTypes } from 'sequelize';
import { models } from '../src/database';

const log = logger(import.meta);

async function main() {
  log.info('✅ Splitting creator and referrer columns in xp logs...');
  const referral_event_ids = await models.sequelize.query<{ id: number }>(
    `
      SELECT id FROM "QuestActionMetas"
      WHERE event_name IN ('SignUpFlowCompleted', 'CommunityCreated', 'CommunityJoined')
      ORDER BY id
    `,
    { type: QueryTypes.SELECT },
  );
  const refEventIds = referral_event_ids.map((r) => r.id);
  log.info('✅ Loaded referral_event_ids', { refEventIds });

  const batchSize = 20_000;
  let offset = 0,
    count = 0;
  do {
    [, count] = await models.sequelize.query(
      `
        UPDATE "XpLogs" xl
        SET 
          referrer_user_id = xl.creator_user_id,
          referrer_xp_points = xl.creator_xp_points,
          creator_user_id = NULL,
          creator_xp_points = NULL
        WHERE xl.id IN (
          SELECT id FROM "XpLogs"
          WHERE 
            action_meta_id = ANY(:meta_ids::int[])
            AND referrer_user_id IS NULL -- only update xp logs that haven't been updated yet
            AND creator_user_id IS NOT NULL
          ORDER BY id
          LIMIT ${batchSize} OFFSET ${offset}
        )
        RETURNING id;
      `,
      {
        replacements: { meta_ids: `{${refEventIds.join(',')}}` },
        type: QueryTypes.UPDATE,
      },
    );

    log.info(`Updated ${count} rows at offset ${offset}...`);
    offset += batchSize;
  } while (count > 0);

  log.info('✅ Split completed!, adding constraint...');
  await models.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_XpLogs_Users_referrer_user_id'
        ) THEN
          ALTER TABLE "XpLogs"
          ADD CONSTRAINT "FK_XpLogs_Users_referrer_user_id"
          FOREIGN KEY ("referrer_user_id")
          REFERENCES "Users" ("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  log.info('✅ Constraint added!');

  exit(0);
}

main().catch((err) => {
  log.error(err);
  exit(1);
});
