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
  await db.sequelize.query(fks.map(dropFk).join('\n'));
  await db.sequelize.sync({ force: true, logging: log ? console.log : false });
  await db.sequelize.query(fks.map(createFk).join('\n'));
};

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  const models = Object.entries(Factories).map(([key, factory]) => [
    key,
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
export * from './api_key';
export * from './chain_node';
export * from './collaboration';
export * from './comment';
export * from './comment_subscriptions';
export * from './comment_version_history';
export * from './community';
export * from './community_role';
export * from './community_stake';
export * from './community_tags';
export * from './discord_bot_config';
export * from './email_update_token';
export * from './evmEventSource';
export * from './group';
export * from './lastProcessedEvmBlock';
export * from './launchpad_trade';
export * from './membership';
export * from './outbox';
export * from './poll';
export * from './profile_tags';
export * from './reaction';
export * from './referral';
export * from './referral_fee';
export * from './role';
export * from './role_assignment';
export * from './sso_token';
export * from './stake_transaction';
export * from './starred_community';
export * from './subscription_preference';
export * from './tags';
export * from './thread';
export * from './thread_version_history';
export * from './topic';
export * from './twitter_cursor';
export * from './types';
export * from './user';
export * from './vote';
export * from './wallets';
export * from './webhook';
