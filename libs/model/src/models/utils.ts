import {
  decamelize,
  MAX_TRUNCATED_CONTENT_LENGTH,
  safeTruncateBody,
} from '@hicommonwealth/shared';
import {
  Model,
  Sequelize,
  type ModelStatic,
  type SyncOptions,
} from 'sequelize';
import type {
  Associable,
  FkMap,
  ManyToManyOptions,
  OneToManyOptions,
  OneToOneOptions,
  RuleOptions,
  State,
} from './types';

/**
 * Enforces fk naming convention
 */
function getDefaultFK<Source extends State, Target extends State>(
  source: ModelStatic<Model<Source>>,
  target: ModelStatic<Model<Target>>,
) {
  const fk = decamelize(`${source.name}_${source.primaryKeyAttribute}`);
  if (!target.getAttributes()[fk])
    throw Error(
      `Table "${target.tableName}" missing foreign key field "${fk}" to "${source.tableName}"`,
    );
  return fk as keyof Target & string;
}

/**
 * Builds on-to-one association between two models
 * @param this source model with FK to target
 * @param target target model with FK to source
 * @param options one-to-one options
 */
export function oneToOne<Source extends State, Target extends State>(
  this: ModelStatic<Model<Source>> & Associable<Source>,
  target: ModelStatic<Model<Target>> & Associable<Target>,
  options?: OneToOneOptions<Source, Target>,
): ModelStatic<Model<Source>> & Associable<Source> {
  const foreignKey = options?.foreignKey ?? getDefaultFK(this, target);

  // sequelize is not creating fk when fk = pk
  if (foreignKey === target.primaryKeyAttribute)
    mapFk(
      target,
      this,
      { primaryKey: [this.primaryKeyAttribute], foreignKey: [foreignKey] },
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    );

  target.belongsTo(this, {
    foreignKey,
    as: options?.as,
    onUpdate: options?.onUpdate ?? 'NO ACTION',
    onDelete: options?.onDelete ?? 'NO ACTION',
  });

  // TODO: why belongsTo iff targetKey is defined + why not hasOne() instead?
  options?.targetKey &&
    this.belongsTo(target, {
      foreignKey: options?.targetKey,
      onUpdate: 'NO ACTION',
      onDelete: 'NO ACTION',
    });

  // don't forget to return this (fluent)
  return this;
}

/**
 * Builds on-to-many association between parent/child models
 * @param this parent model with PK
 * @param child child model with FK
 * @param options one-to-many options
 */
export function oneToMany<Parent extends State, Child extends State>(
  this: ModelStatic<Model<Parent>> & Associable<Parent>,
  child: ModelStatic<Model<Child>> & Associable<Child>,
  options?: OneToManyOptions<Parent, Child>,
): ModelStatic<Model<Parent>> & Associable<Parent> {
  const foreignKey = options?.foreignKey ?? getDefaultFK(this, child);

  const fk = Array.isArray(foreignKey) ? foreignKey[0] : foreignKey;
  this.hasMany(child, {
    foreignKey: { name: fk, allowNull: options?.optional },
    as: options?.asMany,
    onUpdate: options?.onUpdate ?? 'NO ACTION',
    onDelete: options?.onDelete ?? 'NO ACTION',
  });
  child.belongsTo(this, { foreignKey: fk, as: options?.asOne });

  // map fk when parent has composite pk
  if (Array.isArray(foreignKey))
    mapFk(
      child,
      this,
      {
        primaryKey: this.primaryKeyAttributes as Array<keyof Parent & string>,
        foreignKey,
      },
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    );
  // map fk when child has composite pk,
  // or when fk = pk (sequelize is not creating fk when fk = pk)
  else if (
    (child.primaryKeyAttributes.length > 1 &&
      this.primaryKeyAttributes.length === 1) ||
    foreignKey === child.primaryKeyAttribute
  )
    mapFk(
      child,
      this,
      { primaryKey: [this.primaryKeyAttribute], foreignKey: [foreignKey] },
      {
        onUpdate: options?.onUpdate ?? 'NO ACTION',
        onDelete: options?.onDelete ?? 'NO ACTION',
      },
    );

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
  this: ModelStatic<Model<X>> & Associable<X>,
  a: ManyToManyOptions<X, A> & Associable<A>,
  b: ManyToManyOptions<X, B> & Associable<B>,
): ModelStatic<Model<X>> & Associable<X> {
  const foreignKeyA = a.foreignKey ?? getDefaultFK(a.model, this);
  const foreignKeyB = b.foreignKey ?? getDefaultFK(b.model, this);

  this.belongsTo(a.model, {
    foreignKey: { name: foreignKeyA, allowNull: false },
    as: a.asOne,
    onUpdate: a.onUpdate ?? 'NO ACTION',
    onDelete: a.onDelete ?? 'NO ACTION',
  });
  this.belongsTo(b.model, {
    foreignKey: { name: foreignKeyB, allowNull: false },
    as: b.asOne,
    onUpdate: b.onUpdate ?? 'NO ACTION',
    onDelete: b.onDelete ?? 'NO ACTION',
  });
  a.model.hasMany(this, {
    foreignKey: { name: foreignKeyA, allowNull: false },
    hooks: a.hooks,
    as: a.as,
  });
  b.model.hasMany(this, {
    foreignKey: { name: foreignKeyB, allowNull: false },
    hooks: b.hooks,
    as: b.as,
  });
  a.model.belongsToMany(b.model, {
    through: this,
    foreignKey: foreignKeyA,
    as: a.asMany,
  });
  b.model.belongsToMany(a.model, {
    through: this,
    foreignKey: foreignKeyB,
    as: b.asMany,
  });

  // map fk when x-ref has composite pk
  if (this.primaryKeyAttributes.length > 1) {
    mapFk(
      this,
      a.model,
      { primaryKey: [a.model.primaryKeyAttribute], foreignKey: [foreignKeyA] },
      {
        onUpdate: a.onUpdate ?? 'NO ACTION',
        onDelete: a.onDelete ?? 'NO ACTION',
      },
    );
    mapFk(
      this,
      b.model,
      { primaryKey: [b.model.primaryKeyAttribute], foreignKey: [foreignKeyB] },
      {
        onUpdate: b.onUpdate ?? 'NO ACTION',
        onDelete: b.onDelete ?? 'NO ACTION',
      },
    );
  }

  // don't forget to return this (fluent)
  return this;
}

/**
 * Maps composite FK constraints not supported by sequelize, with type safety
 * @param source model with FK
 * @param target model with PK
 * @param rules optional fk rules
 */
export function mapFk<Source extends State, Target extends State>(
  source: ModelStatic<Model<Source>> & Associable<Source>,
  target: ModelStatic<Model<Target>>,
  {
    primaryKey,
    foreignKey,
  }: {
    primaryKey: Array<keyof Target & string>;
    foreignKey: Array<keyof Source & string>;
  },
  rules?: RuleOptions,
) {
  const name = `${source.tableName}_${target.tableName.toLowerCase()}_fkey`;
  const pk = primaryKey.map((k) => target.getAttributes()[k].field!);
  const fk = foreignKey.map((k) => source.getAttributes()[k].field!);
  // console.log(
  //   'mapFk:',
  //   `${name}(${fk.join(', ')}) -> ${target.tableName}(${pk.join(', ')})`,
  // );
  source._fks.push({
    name,
    source: source.tableName,
    fk,
    target: target.tableName,
    pk,
    rules,
  });
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
  sequelize?.query(
    `ALTER TABLE IF EXISTS "${source}" DROP CONSTRAINT IF EXISTS "${name}";`,
  );

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

export const beforeValidateThreadsHook = (instance: {
  body: string;
  content_url?: string | null | undefined;
}) => {
  if (!instance.body || instance.body.length <= MAX_TRUNCATED_CONTENT_LENGTH)
    return;

  if (!instance.content_url) {
    throw new Error(
      'content_url must be defined if body ' +
        `length is greater than ${MAX_TRUNCATED_CONTENT_LENGTH}`,
    );
  } else
    instance.body = safeTruncateBody(
      instance.body,
      MAX_TRUNCATED_CONTENT_LENGTH,
    );
  return instance;
};
