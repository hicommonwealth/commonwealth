import { Model, Sequelize, SyncOptions } from 'sequelize';
import type {
  CompositeKey,
  FkMap,
  ModelStatic,
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

  // map fk when source pk === keys[0]
  if (this.primaryKeyAttribute === keys[0])
    mapFk.apply(target as any, [
      this as any,
      [[keys[1], keys[0]]],
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    ]);

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
  foreignKey: (keyof Child & string) | Array<keyof Child & string>,
  options?: OneToManyOptions<Parent, Child>,
) {
  const fk = Array.isArray(foreignKey) ? foreignKey[0] : foreignKey;
  this.hasMany(child, {
    foreignKey: { name: fk, allowNull: options?.optional },
    as: options?.asMany,
    onUpdate: options?.onUpdate ?? 'NO ACTION',
    onDelete: options?.onDelete ?? 'NO ACTION',
  });
  child.belongsTo(this, { foreignKey: fk, as: options?.asOne });

  // map fk when parent has composite pk
  if (Array.isArray(foreignKey)) {
    mapFk.apply(child as any, [
      this as any,
      foreignKey,
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    ]);
  }
  // map fk when child has composite pk
  else if (
    child.primaryKeyAttributes.length > 1 &&
    this.primaryKeyAttributes.length === 1
  ) {
    mapFk.apply(child as any, [
      this as any,
      [[foreignKey, this.primaryKeyAttribute]],
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    ]);
  }

  // don't forget to return this (fluent)
  return this;
}

/**
 * Builds many-to-many association between three models (A->X<-B)
 * @param this cross-reference model with FKs to A and B
 * @param a [A model with PK, X->A fk field, alias, fk rules]
 * @param b [B model with PK, X->B fk field, alias, fk rules]
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

  // map fk when x-ref has composite pk
  if (this.primaryKeyAttributes.length > 1) {
    mapFk.apply(this as any, [
      a[0] as any,
      [[a[1], a[0].primaryKeyAttribute]],
      {
        onUpdate: a[3]?.onUpdate ?? 'NO ACTION',
        onDelete: a[3]?.onDelete ?? 'NO ACTION',
      },
    ]);
    mapFk.apply(this as any, [
      b[0] as any,
      [[b[1], b[0].primaryKeyAttribute]],
      {
        onUpdate: b[3]?.onUpdate ?? 'NO ACTION',
        onDelete: b[3]?.onDelete ?? 'NO ACTION',
      },
    ]);
  }

  // don't forget to return this (fluent)
  return this;
}

/**
 * Maps composite FK constraints not supported by sequelize, with type safety
 * @param this model with FK
 * @param target model with PK
 * @param keys foreign key fields
 * @param rules optional fk rules
 */
export function mapFk<Source extends State, Target extends State>(
  this: ModelStatic<Model<Source>>,
  target: ModelStatic<Model<Target>>,
  keys: CompositeKey<Source, Target>,
  rules?: RuleOptions,
) {
  const key = keys.map((k) =>
    Array.isArray(k)
      ? ([
          this.getAttributes()[k[0]].field!,
          target.getAttributes()[k[1]].field!,
        ] as [string, string])
      : this.getAttributes()[k].field!,
  );
  const name = `${this.tableName}_${target.tableName.toLowerCase()}_fkey`;
  const fk = key.map((k) => (Array.isArray(k) ? k[0] : k));
  const pk = key.map((k) => (Array.isArray(k) ? k[1] : k));
  // console.log(
  //   'mapFk:',
  //   `${name}(${fk.join(', ')}) -> ${target.tableName}(${pk.join(', ')})`,
  // );
  this._fks.push({
    name,
    source: this.tableName,
    fk,
    target: target.tableName,
    pk,
    rules,
  });

  // don't forget to return this (fluent)
  return this;
}

/**
 * Creates composite FK constraints (not supported by sequelize)
 */
export const createFk = (
  sequelize: Sequelize,
  { name, source, fk, target, pk, rules }: FkMap,
) =>
  sequelize?.query(`
    ALTER TABLE "${source}" ADD CONSTRAINT "${name}"
    FOREIGN KEY (${fk.join(',')}) REFERENCES "${target}"(${pk.join(',')})
    ON UPDATE ${rules?.onUpdate ?? 'NO ACTION'} ON DELETE ${
    rules?.onDelete ?? 'NO ACTION'
  };`);

/**
 * Drops composite FK constraints (not supported by sequelize)
 */
export const dropFk = (sequelize: Sequelize, { source, name }: FkMap) =>
  sequelize?.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
          ALTER TABLE "${source}" DROP CONSTRAINT "${name}";
        END IF;
      END $$;`);

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
