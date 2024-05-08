import * as dotenv from 'dotenv';
dotenv.config();

export const TEST_DB_NAME = 'common_test';

export const DATABASE_URI = (() => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = process.env.DATABASE_ENV || process.env.NODE_ENV;
  if (env === 'test')
    return `postgresql://commonwealth:edgeware@localhost/${TEST_DB_NAME}`;
  else return 'postgresql://commonwealth:edgeware@localhost/commonwealth';
})();

export const TESTING = DATABASE_URI.endsWith(TEST_DB_NAME);
