import { logger } from '@hicommonwealth/core';
import { Sequelize } from 'sequelize';
import { config } from './config';
import { buildDb } from './models';

const log = logger(import.meta);

const dbURI =
  config.NODE_ENV === 'test'
    ? 'postgresql://commonwealth:edgeware@localhost/common_test'
    : config.DB.URI;

export const sequelize = new Sequelize(dbURI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging: config.DB.TRACE ? (msg) => log.trace(msg) : false,
  dialectOptions:
    config.NODE_ENV !== 'production' || config.DB.NO_SSL
      ? { requestTimeout: 40000 }
      : dbURI === 'postgresql://commonwealth:edgeware@localhost/commonwealth'
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
