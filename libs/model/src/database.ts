console.log('FIXME: loading ' + import.meta.url);

import { logger } from '@hicommonwealth/core';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from './config';
import { buildDb } from './models/models';

console.log('FIXME 101 BEFORE models import of buildDb');

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

console.log('FIXME 101');

export const sequelize = new Sequelize(config.DB.URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    config.NODE_ENV === 'test'
      ? false
      : (msg) => {
          log.trace(msg);
        },
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

console.log('FIXME 102');

console.log('FIXME 103: ' + typeof buildDb);

export const models = buildDb(sequelize);

console.log('FIXME 104' + typeof models);
