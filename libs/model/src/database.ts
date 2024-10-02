import { logger } from '@hicommonwealth/core';
import { Sequelize } from 'sequelize';
import { config } from './config';
import { buildDb } from './models';

const log = logger(import.meta);

console.log(
  '==== running in mode',
  config.NODE_ENV,
  config.DB.URI,
  config.DB.NO_SSL,
);

console.log(
  'dialect options are',
  config.NODE_ENV !== 'production' || config.DB.NO_SSL
    ? { requestTimeout: 40000 }
    : config.DB.URI ===
        'postgresql://commonwealth:edgeware@localhost/commonwealth'
      ? { requestTimeout: 40000, ssl: false }
      : { requestTimeout: 40000, ssl: { rejectUnauthorized: false } },
);

export const sequelize = new Sequelize(config.DB.URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging: config.DB.TRACE ? (msg) => log.trace(msg) : false,
  dialectOptions:
    config.NODE_ENV !== 'production' || config.DB.NO_SSL
      ? { requestTimeout: 40000 }
      : config.DB.URI ===
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

console.log('====Finished database setup');

export const models = buildDb(sequelize);
