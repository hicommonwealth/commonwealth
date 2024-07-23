import { logger } from '@hicommonwealth/core';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from './config';
import { buildDb } from './models';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const sequelize = new Sequelize(config.DB.URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    config.NODE_ENV === 'test'
      ? false
      : (msg) => {
          log.trace(msg);
        },
  dialectOptions: () => {
    if (
      config.DB.NO_SSL ||
      config.APP_ENV === 'local' ||
      config.APP_ENV === 'CI'
    ) {
      return { requestTimeout: 40000 };
    } else if (
      config.DB.URI ===
      'postgresql://commonwealth:edgeware@localhost/commonwealth'
    ) {
      return { requestTimeout: 40000, ssl: false };
    } else {
      return { requestTimeout: 40000, ssl: { rejectUnauthorized: false } };
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

export const models = buildDb(sequelize);
