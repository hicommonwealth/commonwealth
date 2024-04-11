import { Model, ModelStatic, Sequelize, SyncOptions } from 'sequelize';
import type { CompositeKey, State } from './types';

/**
 * Builds on-to-many association between two models,
 * @param parent parent model with PK
 * @param child child model with FK
 * @param foreignKey the foreign key field in the child model - sequelize defaults the PK
 * @param optional true to allow children without parents (null FKs), defaults to false
 */
export const oneToMany = <Parent extends State, Child extends State>(
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
 * Maps composite FK constraints with type safety
 */
export const mapFk = <Parent extends State, Child extends State>(
  parent: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  key: CompositeKey<Parent, Child>,
) => ({ parent, child, key: key.map((k) => parent.getAttributes()[k].field!) });

/**
 * Creates composite FK constraints (not supported by sequelize)
 */
export const createFk = (
  sequelize: Sequelize,
  parentTable: string,
  childTable: string,
  key: string[],
) => {
  const fkName = `${childTable}_${parentTable.toLowerCase()}_fkey`;
  const fk = key.map((k) => k).join(',');
  sequelize?.query(
    `
    ALTER TABLE "${childTable}" ADD CONSTRAINT "${fkName}"
    FOREIGN KEY (${fk}) REFERENCES "${parentTable}"(${fk});
    `,
  );
};

/**
 * Drops composite FK constraints (not supported by sequelize)
 */
export const dropFk = (
  sequelize: Sequelize,
  parentTable: string,
  childTable: string,
) => {
  const fkName = `${childTable}_${parentTable.toLowerCase()}_fkey`;
  sequelize?.query(
    `
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname = '${fkName}') THEN
          ALTER TABLE "${childTable}" DROP CONSTRAINT "${fkName}";
        END IF;
      END $$;
      `,
  );
};

/**
 * Model sync hooks that can be used to inspect sequelize generated scripts
 */
export const syncHooks = {
  beforeSync(options: SyncOptions) {
    options.logging = (sql) => {
      const s = sql.replace('Executing (default): ', '');
      if (!s.startsWith('SELECT')) {
        console.info('--', this);
        s.split(';').forEach((l) => console.info(l));
      }
    };
  },
  afterSync(options: SyncOptions) {
    options.logging = false;
  },
};
