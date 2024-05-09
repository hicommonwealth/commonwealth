import { Sequelize } from 'sequelize';
import { buildAssociations } from './associations';
import { Factories, type DB } from './factories';
import { createFk, dropFk, manyToMany, oneToMany, oneToOne } from './utils';

export type { DB };
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

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  const models = Object.values(Factories).map((factory) => [
    factory.name,
    Object.assign(factory(sequelize), {
      _fks: [],
      withOne: oneToOne,
      withMany: oneToMany,
      withManyToMany: manyToMany,
    }),
  ]);

  const db = { sequelize, Sequelize, ...Object.fromEntries(models) } as DB;
  buildAssociations(db);

  return db;
};

// TODO: avoid legacy exports to /packages/commonwealth/server (keep db models encapsulated behind DB)
export * from './address';
export * from './ban';
export * from './chain_node';
export * from './collaboration';
export * from './comment';
export * from './community';
export * from './community_banner';
export * from './community_contract';
export * from './community_contract_template';
export * from './community_contract_template_metadata';
export * from './community_role';
export * from './community_stake';
export * from './contract';
export * from './contract_abi';
export * from './discord_bot_config';
export * from './evmEventSource';
export * from './group';
export * from './lastProcessedEvmBlock';
export * from './login_token';
export * from './membership';
export * from './notification';
export * from './notification_category';
export * from './notifications_read';
export * from './outbox';
export * from './poll';
export * from './profile';
export * from './reaction';
export * from './role';
export * from './role_assignment';
export * from './sso_token';
export * from './stake_transaction';
export * from './starred_community';
export * from './subscription';
export * from './template';
export * from './thread';
export * from './topic';
export * from './types';
export * from './user';
export * from './vote';
export * from './webhook';
