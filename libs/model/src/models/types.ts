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
 * - `hooks`: hooks enabled
 */
export type RuleOptions = {
  onUpdate?: 'CASCADE' | 'NO ACTION' | 'SET NULL';
  onDelete?: 'CASCADE' | 'NO ACTION' | 'SET NULL';
  hooks?: boolean;
};

/**
 * Association alias options
 */
export type AliasOptions<One extends State, Many extends State> = {
  asOne?: keyof Many & string;
  asMany?: keyof One & string;
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
> = RuleOptions &
  AliasOptions<Parent, Child> & {
    optional?: boolean;
  };

/**
 * Many to many association options
 */
export type ManyToManyOptions<X extends State, Source extends State> = {
  model: ModelStatic<Model<Source>>;
  key: keyof X & string;
  as?: keyof Source & string;
  asOne?: keyof X & string;
  asMany?: keyof Source & string;
} & RuleOptions;

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
    /**
     * Builds on-to-one association between two models
     * @param this source model with FK to target
     * @param target target model with FK to source
     * @param keys one-to-one keys [source fk to target, target fk to source]
     * @param options one-to-one options
     */
    withOne: <Target extends State>(
      target: ModelStatic<Model<Target>>,
      keys: [keyof Attributes<SourceModel> & string, keyof Target & string],
      options?: OneToOneOptions<Attributes<SourceModel>>,
    ) => ModelStatic<SourceModel>;
    /**
     * Builds on-to-many association between parent/child models
     * @param this parent model with PK
     * @param child child model with FK
     * @param foreignKey foreign key field in the child model - sequelize defaults the PK
     * @param options one-to-many options
     */
    withMany: <Child extends State>(
      child: ModelStatic<Model<Child>>,
      foreignKey: (keyof Child & string) | Array<keyof Child & string>,
      options?: OneToManyOptions<Attributes<SourceModel>, Child>,
    ) => ModelStatic<SourceModel>;
    /**
     * Builds many-to-many association between three models (A->X<-B)
     * @param this cross-reference model with FKs to A and B
     * @param a X->A options
     * @param b X->B options
     */
    withManyToMany: <A extends State, B extends State>(
      a: ManyToManyOptions<Attributes<SourceModel>, A>,
      b: ManyToManyOptions<Attributes<SourceModel>, B>,
    ) => ModelStatic<SourceModel>;
    // unsupported composite foreign key maps
    _fks: FkMap[];
  } & {
    new (values?: State, options?: BuildOptions): SourceModel;
  };
