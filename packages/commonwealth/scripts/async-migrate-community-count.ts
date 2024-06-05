//TODO: This should be deleted after community counts are recovered
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    const communityIds = (
      await models.sequelize.query(
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
            profile_count = (
                SELECT COUNT(DISTINCT p.id)
                FROM "Profiles" p
                JOIN "Addresses" a ON p.id = a.profile_id
                WHERE a.community_id = :community_id
            )
        WHERE id = :community_id;
        `,
        { replacements: { community_id } },
      );
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('Finished migration');
  process.exit(0);
}

run();
