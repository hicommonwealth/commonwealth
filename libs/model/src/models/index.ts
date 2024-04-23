import { DataTypes, Sequelize } from 'sequelize';
import { buildAssociations } from './associations';
import { Factories } from './factories';
import type { Models } from './types';
import { createFk, dropFk, mapFk, oneToMany } from './utils';

export type DB = Models<typeof Factories> & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};

/**
 * Wraps sequelize sync with the process of building composite foreign key constraints
 * - This is not yet supported by sequelize
 */
export const syncDb = async (db: DB, log = false) => {
  // TODO: build this map when creating one to many associations with composite keys
  const compositeKeys = [
    mapFk(db.Contest, db.ContestAction, ['contest_address', 'contest_id']),
    mapFk(db.ContestManager, db.Contest, ['contest_address']),
    mapFk(db.Topic, db.ContestTopic, [['id', 'topic_id']]),
  ];

  compositeKeys.forEach(({ parent, child }) =>
    dropFk(db.sequelize, parent.tableName, child.tableName),
  );
  await db.sequelize.sync({
    force: true,
    logging: log ? console.log : false,
  });
  compositeKeys.forEach(({ parent, child, key }) =>
    createFk(db.sequelize, parent.tableName, child.tableName, key),
  );
};

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  const models = Object.fromEntries(
    Object.entries(Factories).map(([key, factory]) => {
      const model = factory(sequelize, DataTypes);
      model.withMany = oneToMany as any; // TODO: can we make this work without any?
      return [key, model];
    }),
  ) as Models<typeof Factories>;

  const db = { sequelize, Sequelize, ...models };

  // associate hook
  Object.keys(models).forEach((key) => {
    const model = models[key as keyof typeof Factories];
    'associate' in model && model.associate(db);
  });

  // proposed association builder
  buildAssociations(db);

  return db;
};

// FIXME: avoid legacy exports to /packages/commonwealth/server (keep db models encapsulated behind DB)
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
export * from './community_snapshot_spaces';
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
export * from './snapshot_proposal';
export * from './snapshot_spaces';
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
