console.log('LOADING src/models/db.ts START');
import { Sequelize } from 'sequelize';
import { buildAssociations } from './associations';
import { DB, Factories } from './factories';
import { createFk, dropFk, manyToMany, oneToMany, oneToOne } from './utils';

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  const models = Object.entries(Factories).map(([key, factory]) => {
    if (!factory) {
      throw new Error('No factory for key: ' + key);
    }

    return [
      key,
      Object.assign(factory(sequelize), {
        _fks: [],
        withOne: oneToOne,
        withMany: oneToMany,
        withManyToMany: manyToMany,
      }),
    ];
  });
  const db = { sequelize, Sequelize, ...Object.fromEntries(models) } as DB;
  buildAssociations(db);
  return db;
};
/**
 * Wraps sequelize sync with the process of building composite foreign key constraints
 * - This is not yet supported by sequelize
 */
export const syncDb = async (db: DB, log = false) => {
  const fks = Object.keys(Factories).flatMap(
    (k) => db[k as keyof typeof Factories]._fks,
  );
  fks.forEach((fk) => dropFk(db.sequelize, fk));
  await db.sequelize.sync({
    force: true,
    logging: log ? console.log : false,
  });
  fks.forEach((fk) => createFk(db.sequelize, fk));
};

console.log('LOADING src/models/db.ts END');
