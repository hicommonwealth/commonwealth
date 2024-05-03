import * as dotenv from 'dotenv';
dotenv.config();

export const TEST_DB_NAME = 'common_test';
export const DATABASE_URI =
  process.env.NODE_ENV === 'test'
    ? `postgresql://commonwealth:edgeware@localhost/${TEST_DB_NAME}`
    : !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;
export const TESTING = DATABASE_URI.endsWith(TEST_DB_NAME);
export const DEV = process.env.NODE_ENV !== 'production';
