import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';

import { DATABASE_URI } from './config';

import { factory, formatFilename } from '../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  operatorsAliases: false,
  logging: (process.env.NODE_ENV === 'test') ? false : (msg) => { log.trace(msg); },
  dialectOptions: {
    requestTimeout: 10000
  },
  pool: {
    max: 100,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
});

// TODO: separate Sequelize and SequelizeStatic into new object & type this as Sequelize.Models
const db = {
  sequelize,
  Sequelize,
};

fs.readdirSync(`${__dirname}/models`)
  .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, 'models', file));
    if (!db[model.name]) {
      db[model.name] = model;
    }
  });

// setup associations
Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

export default db;
