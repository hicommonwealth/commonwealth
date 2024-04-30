import {
  Model,
  Sequelize,
  DataTypes as SequelizeDataTypes,
  type Attributes,
  type BuildOptions,
} from 'sequelize';

/**
 * Association rule options
 * - `onUpdate`: update rule, 'NO ACTION' by default
 * - `onDelete`: delete rule, 'NO ACTION' by default
 */
export type RuleOptions = {
  onUpdate?: 'CASCADE' | 'NO ACTION' | 'SET NULL';
  onDelete?: 'CASCADE' | 'NO ACTION' | 'SET NULL';
};

/**
 * One to one association options
 * - `as`: association alias - defaults to model name
 */
export type OneToOneOptions<Source extends State> = RuleOptions & {
  as?: keyof Source & string;
};

/**
 * One to many association options
 * - `asOne`: parent association alias - defaults to model name
 * - `asMany`: children association alias - defaults to model name
 * - `optional`: true to allow children without parents (null FKs) - defaults to false
 */
export type OneToManyOptions<
  Parent extends State,
  Child extends State,
> = RuleOptions & {
  asOne?: keyof Child & string;
  asMany?: keyof Parent & string;
  optional?: boolean;
};

type ModelFactory<T> = (sequelize: Sequelize) => T;
type ModelFactories = Record<string, ModelFactory<unknown>>;
export type Models<T extends ModelFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type State = Record<string, unknown>;
export type ModelInstance<Attrs extends State> = Model<Attrs> & Attrs;
export type ModelStatic<ParentModel extends Model> =
  typeof Model<ParentModel> & {
    associate: (models: Models<any>) => void;
    withOne: <Target extends State>(
      target: ModelStatic<Model<Target>>,
      keys: [keyof Attributes<ParentModel> & string, keyof Target & string],
      options?: OneToOneOptions<Attributes<ParentModel>>,
    ) => ModelStatic<ParentModel>;
    withMany: <Child extends State>(
      child: ModelStatic<Model<Child>>,
      foreignKey: keyof Child & string,
      options?: OneToManyOptions<Attributes<ParentModel>, Child>,
    ) => ModelStatic<ParentModel>;
    withManyToMany: <A extends State, B extends State>(
      a: [
        ModelStatic<Model<A>>,
        keyof Attributes<ParentModel> & string,
        string,
        RuleOptions,
      ],
      b: [
        ModelStatic<Model<B>>,
        keyof Attributes<ParentModel> & string,
        string,
        RuleOptions,
      ],
    ) => ModelStatic<ParentModel>;
  } & {
    new (values?: State, options?: BuildOptions): ParentModel;
  };

/**
 * Composite key mappings (must match field names in parent and child)
 */
export type KeyMap<Parent extends State, Child extends State> =
  | (keyof Parent & keyof Child & string)
  | [keyof Parent & string, keyof Child & string];
export type CompositeKey<Parent extends State, Child extends State> = Array<
  KeyMap<Parent, Child>
>;
export type CompositeMap<Parent extends State, Child extends State> = {
  parent: ModelStatic<Model<Parent>>;
  child: ModelStatic<Model<Child>>;
  key: CompositeKey<Parent, Child>;
};

export type DataTypes = {
  STRING: typeof SequelizeDataTypes.STRING;
  INTEGER: typeof SequelizeDataTypes.INTEGER;
  TEXT: typeof SequelizeDataTypes.TEXT;
  BOOLEAN: typeof SequelizeDataTypes.BOOLEAN;
  DATE: typeof SequelizeDataTypes.DATE;
  ARRAY: typeof SequelizeDataTypes.ARRAY;
  JSON: typeof SequelizeDataTypes.JSON;
  JSONB: typeof SequelizeDataTypes.JSONB;
  BIGINT: typeof SequelizeDataTypes.BIGINT;
  ENUM: typeof SequelizeDataTypes.ENUM;
};
