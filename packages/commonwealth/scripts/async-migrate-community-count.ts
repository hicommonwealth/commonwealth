import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    const communityIds = (
      await models.sequelize.query<{ id: string }>(
        `SELECT id FROM "Communities" where count_updated = false`,
        {
          raw: true,
          type: QueryTypes.SELECT,
        },
      )
    ).map((c) => c.id);

    for (const community_id of communityIds) {
      console.log(`Updating thread/profile counts for ${community_id}`);
      await models.sequelize.query(
        `
        UPDATE "Communities"
        SET count_updated = true,
            thread_count = (SELECT COUNT(*) FROM "Threads" WHERE community_id = :community_id),
            profile_count = (SELECT COUNT(*) FROM "Addresses" WHERE a.community_id = :community_id)
        WHERE id = :community_id;
        `,
        { replacements: { community_id } },
      );
    }
    console.log('Finished migration');
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error('Migration failed'); // Let the environment handle the exit
  }
}

run()
  .then(() => {
    void dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('Failed to migrate community counts:', error);
  });
