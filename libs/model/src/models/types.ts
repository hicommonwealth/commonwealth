import {
  Model,
  Sequelize,
  type Attributes,
  type BuildOptions,
} from 'sequelize';

export type State = Record<string, unknown>;

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

/**
 * Composite foreign key mappings
 */
export type KeyMap<Source extends State, Target extends State> =
  | (keyof Source & keyof Target & string)
  | [keyof Source & string, keyof Target & string];
export type CompositeKey<Source extends State, Target extends State> = Array<
  KeyMap<Source, Target>
>;
export type FkMap = {
  name: string;
  source: string;
  fk: string[];
  target: string;
  pk: string[];
  rules?: RuleOptions;
};

/**
 * Model factories
 */
type ModelFactory<T> = (sequelize: Sequelize) => T;
type ModelFactories = Record<string, ModelFactory<unknown>>;
export type Models<T extends ModelFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type ModelInstance<Attrs extends State> = Model<Attrs> & Attrs;
export type ModelStatic<SourceModel extends Model> =
  typeof Model<SourceModel> & {
    associate: (models: Models<any>) => void;
    withOne: <Target extends State>(
      target: ModelStatic<Model<Target>>,
      keys: [keyof Attributes<SourceModel> & string, keyof Target & string],
      options?: OneToOneOptions<Attributes<SourceModel>>,
    ) => ModelStatic<SourceModel>;
    withMany: <Child extends State>(
      child: ModelStatic<Model<Child>>,
      foreignKey: (keyof Child & string) | Array<keyof Child & string>,
      options?: OneToManyOptions<Attributes<SourceModel>, Child>,
    ) => ModelStatic<SourceModel>;
    withManyToMany: <A extends State, B extends State>(
      a: [
        ModelStatic<Model<A>>,
        keyof Attributes<SourceModel> & string,
        string,
        RuleOptions,
      ],
      b: [
        ModelStatic<Model<B>>,
        keyof Attributes<SourceModel> & string,
        string,
        RuleOptions,
      ],
    ) => ModelStatic<SourceModel>;
    // unsupported composite foreign key maps
    _fks: FkMap[];
  } & {
    new (values?: State, options?: BuildOptions): SourceModel;
  };
