#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

if (process.argv.length < 4) {
  console.error(
    'Usage: ts-node detectMatureE2e.ts failingTestDirectory flakyTestDirectory matureTestDirectory'
  );
  process.exit(1); // Exit with an error code
}

// The purpose of this script is to record the failures of e2e tests, and then return a list of e2e tests that are
// mature (Not flaky). These non-flaky tests will then be moved into the mature suite.
console.log(process.env.AUXILIARY_DB_URL);
const db = new Client({
  connectionString: process.env.AUXILIARY_DB_URL,
});

// after the test is stable for this many days, graduate it into the mature suite.
const matureGraduationDays = 14;

async function detectMatureE2e(
  failingTestDirectory: string,
  flakyTestDirectory: string,
  matureTestDirectory: string
) {
  await db.connect();

  await db.query(`
    CREATE TABLE IF NOT EXISTS matureE2eTests (
        name VARCHAR(255) PRIMARY KEY,
        date_of_last_failure DATE
    );
    `);

  try {
    const failedTests = fs.readdirSync(failingTestDirectory);

    // upsert failed tests in db
    for (const testName of failedTests) {
      await db.query(
        `
         INSERT INTO matureE2eTests (name, date_of_last_failure)
         VALUES ($1, NOW())
         ON CONFLICT (name) DO UPDATE
         SET date_of_last_failure = EXCLUDED.date_of_last_failure;
      `,
        [testName]
      );
    }

    const graduatedTests = await db.query(
      `
      SELECT name from matureE2eTests
      WHERE date_of_last_failure <= NOW() - $1 * INTERVAL '1 day'
    `,
      [matureGraduationDays]
    );

    for (const test of graduatedTests.rows) {
      const testFileName = test.name;
      fs.rename(
        path.join(flakyTestDirectory, testFileName),
        path.join(matureTestDirectory, testFileName),
        function (err) {
          if (err)
            console.log(`Failed to move file ${testFileName}. Error:\n${err}`);
        }
      );
    }
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
  } finally {
    db.end(); // Close the database connection
  }
}

detectMatureE2e(process.argv[2], process.argv[3], process.argv[4])
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
