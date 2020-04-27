import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';

import { DATABASE_URI } from './config';

const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  operatorsAliases: false,
  logging: (process.env.NODE_ENV === 'test') ? false : () => {},
});
const db = { sequelize, Sequelize };

// import all files in models folder
fs.readdirSync(__dirname + '/models')
  .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, 'models', file));
    db[model.name] = model;
  });

// setup associations
Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

export default db;
