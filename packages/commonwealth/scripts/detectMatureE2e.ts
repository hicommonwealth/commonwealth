#!/usr/bin/env ts-node

const fs = require('fs').promises;
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
const db = new Client({
  connectionString: process.env.AUXILIARY_DB_URL,
});

function getDistinctFiles(file) {
  const parts = file.split(':');
  parts.pop();
  parts.pop();

  return parts.join(':');
}

// after the test is stable for this many days, graduate it into the mature suite.
const matureGraduationDays = 14;

async function detectMatureE2e(
  testSummaryPath: string,
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
    const data = await fs.readFile(testSummaryPath, 'utf8');
    const testFailures = JSON.parse(data)['failed'];
    const testSuccesses = JSON.parse(data)['passed'];

    // test results look like: e2eRegular/createCommunity.spec.ts:54:7. We want to remove the line info
    // and get only unique files.
    const uniqueTestFailures = Array.from(
      new Set(
        testFailures.map((t) => {
          getDistinctFiles(t);
        })
      )
    );

    // we need passed tests to ensure that they are in the database so that we can track how long they pass for.
    const uniqueTestSuccesses = Array.from(
      new Set(
        testFailures.map((t) => {
          getDistinctFiles(t);
        })
      )
    );

    // upsert failed tests in db
    await Promise.all(
      uniqueTestSuccesses.map((testName) => {
        db.query(
          `
         INSERT INTO matureE2eTests (name, date_of_last_failure)
         VALUES ($1, NOW())
         ON CONFLICT (name) DO UPDATE
         SET date_of_last_failure = EXCLUDED.date_of_last_failure;
      `,
          [testName]
        );
      })
    );

    // insert passing tests if they don't exist.
    await Promise.all(
      uniqueTestSuccesses.map((testName) => {
        db.query(
          `
         INSERT INTO matureE2eTests (name, date_of_last_failure)
         VALUES ($1, NOW())
         ON CONFLICT (name) DO NOTHING
      `,
          [testName]
        );
      })
    );

    const graduatedTests = await db.query(
      `
      SELECT name from matureE2eTests
      WHERE date_of_last_failure <= NOW() - $1 * INTERVAL '1 day'
    `,
      [matureGraduationDays]
    );

    for (const test of graduatedTests.rows) {
      const testFileName = test.name;
      const maturePath = path.join(matureTestDirectory, testFileName);

      try {
        await fs.mkdir(path.dirname(maturePath));
      } catch (e) {
        if (e.code === 'EEXIST') {
          // do nothing because directory already exists
        } else {
          console.error('failed to create directory', e);
        }
      }

      try {
        await fs.rename(
          path.join(flakyTestDirectory, testFileName),
          maturePath
        );
      } catch (e) {
        console.log(`Failed to move file ${testFileName}. Error:\n${e}`);
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
  } finally {
    db.end();
  }
}

detectMatureE2e(process.argv[2], process.argv[3], process.argv[4])
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
