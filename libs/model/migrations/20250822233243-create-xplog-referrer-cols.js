'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='XpLogs' AND column_name='referrer_user_id'
        ) THEN
          ALTER TABLE "XpLogs" ADD COLUMN referrer_user_id INTEGER;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='XpLogs' AND column_name='referrer_xp_points'
        ) THEN
          ALTER TABLE "XpLogs" ADD COLUMN referrer_xp_points INTEGER;
        END IF;
      END$$;
    `);
    console.log('✅ Migrated create-xplog-referrer-cols');

    const [referral_event_ids] = await queryInterface.sequelize.query(`
      SELECT id FROM "QuestActionMetas"
      WHERE event_name IN ('SignUpFlowCompleted', 'CommunityCreated', 'CommunityJoined')
      ORDER BY id
    `);
    const refEventIds = referral_event_ids.map((r) => r.id);
    console.log('✅ Loaded referral_event_ids', refEventIds);

    const batchSize = 10000;
    let offset = 0;
    let updated;
    do {
      // 4️⃣ Update a batch of rows
      [updated] = await queryInterface.sequelize.query(
        `
        UPDATE "XpLogs" xl
        SET 
          referrer_user_id = xl.creator_user_id,
          referrer_xp_points = xl.creator_xp_points,
          creator_user_id = NULL,
          creator_xp_points = NULL
        WHERE xl.id IN (
          SELECT id FROM "XpLogs"
          WHERE creator_user_id IS NOT NULL
            AND action_meta_id = ANY(:meta_ids::int[])
          ORDER BY id
          LIMIT ${batchSize} OFFSET ${offset}
        )
        RETURNING id;
      `,
        {
          replacements: { meta_ids: `{${refEventIds.join(',')}}` },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );

      console.log(`Updated ${updated.length} rows`);
      offset += batchSize;
    } while (updated.length > 0);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_XpLogs_Users_referrer_user_id'
        ) THEN
          ALTER TABLE "XpLogs"
          ADD CONSTRAINT "FK_XpLogs_Users_referrer_user_id"
          FOREIGN KEY (referrer_user_id) REFERENCES "Users"(id)
          ON UPDATE NO ACTION ON DELETE NO ACTION;
        END IF;
      END$$;
    `);
    console.log('✅ Migrated create-xplog-referrer-cols');
  },

  async down() {},
};
