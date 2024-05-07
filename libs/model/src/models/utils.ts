import { Model, Sequelize, SyncOptions } from 'sequelize';
import type {
  CompositeKey,
  FkMap,
  ManyToManyOptions,
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
    as: options?.as,
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
 * @param a [A model with PK, X->A fk field, aliases, fk rules]
 * @param b [B model with PK, X->B fk field, aliases, fk rules]
 */
export function manyToMany<X extends State, A extends State, B extends State>(
  this: ModelStatic<Model<X>>,
  a: ManyToManyOptions<X, A>,
  b: ManyToManyOptions<X, B>,
) {
  this.belongsTo(a.model, {
    foreignKey: { name: a.key, allowNull: false },
    as: a.asOne,
    onUpdate: a.onUpdate ?? 'NO ACTION',
    onDelete: a.onDelete ?? 'NO ACTION',
  });
  this.belongsTo(b.model, {
    foreignKey: { name: b.key, allowNull: false },
    as: b.asOne,
    onUpdate: b.onUpdate ?? 'NO ACTION',
    onDelete: b.onDelete ?? 'NO ACTION',
  });
  a.model.hasMany(this, {
    foreignKey: { name: a.key, allowNull: false },
    hooks: a.hooks,
    as: a.as,
  });
  b.model.hasMany(this, {
    foreignKey: { name: b.key, allowNull: false },
    hooks: b.hooks,
    as: b.as,
  });
  a.model.belongsToMany(b.model, {
    through: this,
    foreignKey: a.key,
    as: a.asMany,
  });
  b.model.belongsToMany(a.model, {
    through: this,
    foreignKey: b.key,
    as: b.asMany,
  });

  // map fk when x-ref has composite pk
  if (this.primaryKeyAttributes.length > 1) {
    mapFk.apply(this as any, [
      a.model as any,
      [[a.key, a.model.primaryKeyAttribute]],
      {
        onUpdate: a.onUpdate ?? 'NO ACTION',
        onDelete: a.onDelete ?? 'NO ACTION',
      },
    ]);
    mapFk.apply(this as any, [
      b.model as any,
      [[b.key, b.model.primaryKeyAttribute]],
      {
        onUpdate: b.onUpdate ?? 'NO ACTION',
        onDelete: b.onDelete ?? 'NO ACTION',
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
