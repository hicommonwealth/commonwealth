import { Sequelize } from 'sequelize';
import { buildAssociations } from './associations';
import { Factories } from './factories';
import type { Models } from './types';
import { createFk, dropFk, manyToMany, oneToMany, oneToOne } from './utils';

export type DB = Models<typeof Factories> & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
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

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  const models = Object.fromEntries(
    Object.entries(Factories).map(([key, factory]) => {
      const model = factory(sequelize);
      model._fks = [];
      // TODO: can we make this work without any?
      model.withOne = oneToOne as any;
      model.withMany = oneToMany as any;
      model.withManyToMany = manyToMany as any;
      return [key, model];
    }),
  );

  const db = { sequelize, Sequelize, ...models } as DB;
  buildAssociations(db);

  // TODO: remove legacy associate hook
  Object.keys(models).forEach((key) => {
    const model = models[key as keyof typeof Factories];
    'associate' in model && model.associate(db);
  });

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
