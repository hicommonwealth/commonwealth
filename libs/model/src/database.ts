import { logger } from '@hicommonwealth/logging';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { DATABASE_URI, TESTING } from './config';
import { buildDb } from './models';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

!process.env.DATABASE_URL &&
  process.env.NODE_ENV !== 'production' &&
  console.warn(`NODE_ENV=${process.env.NODE_ENV} DB_URI=${DATABASE_URI}`);

export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging: TESTING
    ? false
    : (msg) => {
        log.trace(msg);
      },
  dialectOptions:
    process.env.NODE_ENV !== 'production' || process.env.NO_SSL
      ? { requestTimeout: 40000 }
      : DATABASE_URI ===
        'postgresql://commonwealth:edgeware@localhost/commonwealth'
      ? { requestTimeout: 40000, ssl: false }
      : { requestTimeout: 40000, ssl: { rejectUnauthorized: false } },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

export const models = buildDb(sequelize);
