import { factory, formatFilename } from 'common-common/src/logging';
import { Sequelize, DataTypes } from 'sequelize';
import { DATABASE_URI } from './config';

const log = factory.getLogger(formatFilename(__filename));

export default function connect() {
  console.log('INITIALIZING REAL DATABASE');
  return new Sequelize(DATABASE_URI, {
    // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
    // operatorsAliases: false,
    logging:
      process.env.NODE_ENV === 'test'
        ? false
        : (msg) => {
            log.trace(msg);
          },
    dialectOptions:
      process.env.NODE_ENV !== 'production' ? { requestTimeout: 40000 } :
      DATABASE_URI === "postgresql://commonwealth:edgeware@localhost/commonwealth" ?
      { requestTimeout: 40000, ssl: false } :
      { requestTimeout: 40000, ssl: { rejectUnauthorized: false } },
    pool: {
      max: 10,
      min: 0,
      acquire: 40000,
      idle: 40000,
    },
  });
}
