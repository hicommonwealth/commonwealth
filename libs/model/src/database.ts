import { logger } from '@hicommonwealth/logging';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from './config';
import { buildDb } from './models';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const sequelize = new Sequelize(config.db.uri, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    config.env === 'test'
      ? false
      : (msg) => {
          log.trace(msg);
        },
  dialectOptions:
    config.env !== 'production' || config.db.noSsl
      ? { requestTimeout: 40000 }
      : config.db.uri ===
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
