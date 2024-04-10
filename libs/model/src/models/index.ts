import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';
import { Factories } from './factories';
import type { Models } from './types';

export type DB = Models<typeof Factories> & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};

/**
 * Builds on-to-many association between two models,
 * @param parent parent model with PK
 * @param child child model with FK
 * @param foreignKey the foreign key field in the child model - sequelize defaults the PK
 * @param optional true to allow children without parents (null FKs), defaults to false
 */
const oneToMany = <
  Parent extends Record<string, unknown>,
  Child extends Record<string, unknown>,
>(
  parent: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  foreignKey: keyof Child & string,
  optional?: boolean,
) => {
  // this can be optional
  parent.hasMany(child, {
    foreignKey: { name: foreignKey, allowNull: optional },
  });
  // this can be optional
  child.belongsTo(parent, { foreignKey });
};

/**
 * Composite key mappings (must match field names in parent and child)
 */
type CompositeKey<
  Parent extends Record<string, unknown>,
  Child extends Record<string, unknown>,
> = Array<keyof Parent & keyof Child & string>;

/**
 * Builds composite FK constraints (not supported by sequelize)
 * @param parent parent model with target field
 * @param child child model with FK field
 * @param key composite key
 * @param drop drops key instead (to avoid SequelizeUnknownConstraintError on sync)
 */
export const buildCompositeFK = <
  Parent extends Record<string, unknown>,
  Child extends Record<string, unknown>,
>(
  parent: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  key: CompositeKey<Parent, Child>,
  drop = false,
) => {
  const fkName = `${child.tableName}_${parent.tableName}_fkey`;
  const fk = key.map((k) => k).join(',');
  child.sequelize?.query(
    drop
      ? `
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname = '${fkName}') THEN
          ALTER TABLE "${child.tableName}" DROP CONSTRAINT "${fkName}";
        END IF;
      END $$;
      `
      : `
    ALTER TABLE "${child.tableName}" ADD CONSTRAINT "${fkName}"
    FOREIGN KEY (${fk}) REFERENCES "${parent.tableName}"(${fk});
    `,
  );
};

/**
 * Builds sequelize models by invoking factories with a sequelize instance, and linking associations
 * @param sequelize sequelize instance
 * @returns built db model
 */
export const buildDb = (sequelize: Sequelize): DB => {
  // build models
  const models = Object.fromEntries(
    Object.entries(Factories).map(([key, factory]) => [
      key,
      factory(sequelize, DataTypes),
    ]),
  ) as Models<typeof Factories>;

  const db = { sequelize, Sequelize, ...models };

  // setup associations
  Object.keys(models).forEach((key) => {
    const model = models[key as keyof typeof Factories];
    'associate' in model && model.associate(db);
  });

  // TODO: proposed pattern to associate models with type safety
  /**
   * Find a way to write this as:
   *
   * db.Community
   *    .toMany(db.ContestManager, 'communityId')
   *    .toMany(db.Topic, 'communityId')...
   */
  oneToMany(db.Community, db.ContestManager, 'communityId');
  oneToMany(db.ContestManager, db.Contest, 'contest');
  oneToMany(db.Contest, db.ContestAction, 'contest');

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
