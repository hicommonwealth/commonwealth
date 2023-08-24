import fs from 'fs';
import { Client } from 'pg';

const client = new Client({});

async function getTestSummary() {
  const summaryFilePath = 'summary.json';
  try {
    const summaryData = fs.readFileSync(summaryFilePath, 'utf-8');
    return JSON.parse(summaryData);
  } catch (error) {
    console.error('Error reading summary.json:', error);
    process.exit(1);
  }
}

async function main() {
  const testSummary = getTestSummary();
  const dateOfLastFailure = testSummary['startedAt'];

  try {
    await client.connect();
    // for passed tests we want to insert an entry into the database. We need to give it some dateOfLastFailure
    // we choose it to be on its first run, since that way we can determine how long it has been passing for.
    for (const test of testSummary['passed']) {
      const upsertQuery = `
                INSERT INTO "TestResults" ("testName", "dateOfLastFailure")
                VALUES ($1, $2)
                ON CONFLICT ("testName")
                DO NOTHING;
            `;
      const values = [test, dateOfLastFailure]; // make sure params are sanitized

      await client.query(upsertQuery, values);
    }

    for (const test of testSummary['failed']) {
      const upsertQuery = `
                INSERT INTO "TestResults" ("testName", "dateOfLastFailure")
                VALUES ($1, $2)
                ON CONFLICT ("testName")
                DO UPDATE SET "dateOfLastFailure" = EXCLUDED."dateOfLastFailure";
            `;
      const values = [test, dateOfLastFailure]; // make sure params are sanitized

      await client.query(upsertQuery, values);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
