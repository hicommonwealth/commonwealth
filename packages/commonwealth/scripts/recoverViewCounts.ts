//TODO: This should be deleted after view counts are recovered.
import dotenv from 'dotenv';
import { Client } from 'pg';
import { exit } from 'yargs';
import models from '../server/database';

dotenv.config();

const connectionString = process.env.RECOVERY_DATABASE_URI;

if (!connectionString) {
  console.error('RECOVERY_DATABASE_URI not provided.');
  process.exit(1);
}

const recoveryClient = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await recoveryClient.connect();

    const viewCounts = await recoveryClient.query(
      `SELECT object_id, view_count FROM "ViewCounts" WHERE object_id NOT ILIKE '%discussion_%';`,
    );

    const batchSize = 10;
    const totalRows = viewCounts.rows.length;

    const batchedQuery = (batchedViewCounts) => `
        UPDATE "Threads"
        SET view_count_recovered = true,
        new_view_count = CASE 
            ${batchedViewCounts
              .map(
                (count) =>
                  `WHEN id = ${count.object_id} THEN new_view_count + ${count.view_count}`,
              )
              .join(' ')}
        ELSE new_view_count
        END
        WHERE id IN (${batchedViewCounts
          .map((count) => count.object_id)
          .join(', ')})
        AND view_count_recovered = false;
        `;

    for (let i = 0; i < totalRows; i += batchSize) {
      const endIndex = Math.min(i + batchSize, totalRows); // make sure we don't go past end of array
      await models.sequelize.query(
        batchedQuery(viewCounts.rows.slice(i, endIndex)),
      );
      console.log(`recovered view counts for threads ${endIndex}/${totalRows}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    exit(1, error);
  } finally {
    await recoveryClient.end();
  }

  exit(0, null);
}

run();
