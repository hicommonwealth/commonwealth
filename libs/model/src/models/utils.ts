import { Model, ModelStatic, Sequelize, SyncOptions } from 'sequelize';
import type { CompositeKey, State } from './types';

/**
 * Builds on-to-many association between parent/child models
 * @param this parent model with PK
 * @param child child model with FK
 * @param foreignKey foreign key field in the child model - sequelize defaults the PK
 * @param options -
 *   - `as`: association alias - defaults to model name
 *   - `optional`: true to allow children without parents (null FKs) - defaults to false
 */
export function oneToMany<Parent extends State, Child extends State>(
  this: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  foreignKey: keyof Child & string,
  options?: { as?: string; optional?: boolean },
) {
  // can be optional
  this.hasMany(child, {
    foreignKey: { name: foreignKey, allowNull: options?.optional },
    as: options?.as,
  });
  // can be optional
  child.belongsTo(this, { foreignKey });

  // don't forget to return this (fluent)
  return this;
}

/**
 * Builds many-to-many association between three models (A->X<-B)
 * @param this cross-reference model with FKs to A and B
 * @param a left model with PK
 * @param b right model with PK
 * @param foreignKey foreign key fields in X to [A,B]
 * @param as association aliases [a,b]
 */
export function manyToMany<X extends State, A extends State, B extends State>(
  this: ModelStatic<Model<X>>,
  a: [ModelStatic<Model<A>>, keyof X & string, string],
  b: [ModelStatic<Model<B>>, keyof X & string, string],
) {
  this.belongsTo(a[0], { foreignKey: { name: a[1], allowNull: false } });
  this.belongsTo(b[0], { foreignKey: { name: b[1], allowNull: false } });
  a[0].hasMany(this, { foreignKey: { name: a[1], allowNull: false } });
  b[0].hasMany(this, { foreignKey: { name: b[1], allowNull: false } });
  a[0].belongsToMany(b[0], { through: this, foreignKey: a[1], as: b[2] });
  b[0].belongsToMany(a[0], { through: this, foreignKey: b[1], as: a[2] });

  // don't forget to return this (fluent)
  return this;
}

/**
 * Maps composite FK constraints with type safety
 */
export const mapFk = <Parent extends State, Child extends State>(
  parent: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  key: CompositeKey<Parent, Child>,
) => ({
  parent,
  child,
  key: key.map((k) =>
    Array.isArray(k)
      ? [
          parent.getAttributes()[k[0]].field!,
          child.getAttributes()[k[1]].field!,
        ]
      : parent.getAttributes()[k].field!,
  ) as Array<string | [string, string]>,
});

/**
 * Creates composite FK constraints (not supported by sequelize)
 */
export const createFk = (
  sequelize: Sequelize,
  parentTable: string,
  childTable: string,
  key: Array<string | [string, string]>,
) => {
  const fkName = `${childTable}_${parentTable.toLowerCase()}_fkey`;
  const pk = key.map((k) => (Array.isArray(k) ? k[0] : k)).join(',');
  const fk = key.map((k) => (Array.isArray(k) ? k[1] : k)).join(',');
  sequelize?.query(
    `
    ALTER TABLE "${childTable}" ADD CONSTRAINT "${fkName}"
    FOREIGN KEY (${fk}) REFERENCES "${parentTable}"(${pk});
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
