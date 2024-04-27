import { Model, ModelStatic, Sequelize, SyncOptions } from 'sequelize';
import type {
  CompositeKey,
  OneToManyOptions,
  OneToOneOptions,
  RuleOptions,
  State,
} from './types';

/**
 * Builds on-to-one association between two models
 * @param this source model with FK to target
 * @param target target model with FK to source
 * @param keys one-to-one keys [source fk to target, target fk to source]
 */
export function oneToOne<Source extends State, Target extends State>(
  this: ModelStatic<Model<Source>>,
  target: ModelStatic<Model<Target>>,
  keys: [keyof Source & string, keyof Target & string],
  options?: OneToOneOptions<Source>,
) {
  this.belongsTo(target, {
    foreignKey: keys[0],
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  target.belongsTo(this, {
    foreignKey: keys[1],
    onUpdate: options?.onUpdate ?? 'NO ACTION',
    onDelete: options?.onDelete ?? 'NO ACTION',
  });

  // don't forget to return this (fluent)
  return this;
}

/**
 * Builds on-to-many association between parent/child models
 * @param this parent model with PK
 * @param child child model with FK
 * @param foreignKey foreign key field in the child model - sequelize defaults the PK
 * @param options one-to-many options
 */
export function oneToMany<Parent extends State, Child extends State>(
  this: ModelStatic<Model<Parent>>,
  child: ModelStatic<Model<Child>>,
  foreignKey: keyof Child & string,
  options?: OneToManyOptions<Parent, Child>,
) {
  this.hasMany(child, {
    foreignKey: { name: foreignKey, allowNull: options?.optional },
    as: options?.asMany,
    onUpdate: options?.onUpdate ?? 'NO ACTION',
    onDelete: options?.onDelete ?? 'NO ACTION',
  });
  child.belongsTo(this, { foreignKey, as: options?.asOne });

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
  a: [ModelStatic<Model<A>>, keyof X & string, string, RuleOptions],
  b: [ModelStatic<Model<B>>, keyof X & string, string, RuleOptions],
) {
  this.belongsTo(a[0], {
    foreignKey: { name: a[1], allowNull: false },
    onUpdate: a[3]?.onUpdate ?? 'NO ACTION',
    onDelete: a[3]?.onDelete ?? 'NO ACTION',
  });
  this.belongsTo(b[0], {
    foreignKey: { name: b[1], allowNull: false },
    onUpdate: b[3]?.onUpdate ?? 'NO ACTION',
    onDelete: b[3]?.onDelete ?? 'NO ACTION',
  });
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
  rules?: RuleOptions,
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
  rules,
});

/**
 * Creates composite FK constraints (not supported by sequelize)
 */
export const createFk = (
  sequelize: Sequelize,
  parentTable: string,
  childTable: string,
  key: Array<string | [string, string]>,
  rules?: RuleOptions,
) => {
  const fkName = `${childTable}_${parentTable.toLowerCase()}_fkey`;
  const pk = key.map((k) => (Array.isArray(k) ? k[0] : k)).join(',');
  const fk = key.map((k) => (Array.isArray(k) ? k[1] : k)).join(',');
  sequelize?.query(
    `
    ALTER TABLE "${childTable}" ADD CONSTRAINT "${fkName}"
    FOREIGN KEY (${fk}) REFERENCES "${parentTable}"(${pk})
    ON UPDATE ${rules?.onUpdate ?? 'NO ACTION'} ON DELETE ${
      rules?.onDelete ?? 'NO ACTION'
    };
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
