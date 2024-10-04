import { Attributes, Model, ModelStatic } from 'sequelize';

export type State = Record<string, unknown>;
export type ModelInstance<Attrs extends State> = Model<Attrs> & Attrs;

/**
 * Association rule options
 * @param onUpdate update rule, 'NO ACTION' by default
 * @param onDelete delete rule, 'NO ACTION' by default
 * @param hooks hooks enabled
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
 * @param foreignKey foreign key to source - defaults to source_pk
 * @param targetKey foreign key to target - defalts to target_pk
 * @param as association alias - defaults to model name
 */
export type OneToOneOptions<Source extends State, Target extends State> = {
  foreignKey?: keyof Target & string;
  targetKey?: keyof Source & string;
  as?: keyof Target & string;
} & RuleOptions;

/**
 * One to many association options
 * @param foreignKey foreign key to source - defaults to source_pk
 * @param asOne parent association alias - defaults to model name
 * @param asMany children association alias - defaults to model name
 * @param optional true to allow children without parents (null FKs) - defaults to false
 */
export type OneToManyOptions<Parent extends State, Child extends State> = {
  foreignKey?: (keyof Child & string) | Array<keyof Child & string>;
} & RuleOptions &
  AliasOptions<Parent, Child> & {
    optional?: boolean;
  };

/**
 * Many to many association options
 * @param model one of the two source models
 * @param foreignKey foreign key to source - defaults to source_pk
 * @param as association alias - defaults to model name
 * @param asOne one association alias - defaults to model name
 * @param asMany many association alias - defaults to model name
 */
export type ManyToManyOptions<X extends State, Source extends State> = {
  model: ModelStatic<Model<Source>>;
  foreignKey?: keyof X & string;
  as?: keyof Source & string;
  asOne?: keyof X & string;
  asMany?: keyof Source & string;
} & RuleOptions;

/**
 * Holds fk mappings not supported by sequelize
 */
export type FkMap = {
  name: string;
  source: string;
  fk: string[];
  target: string;
  pk: string[];
  rules?: RuleOptions;
};

/**
 * Model association methods
 */
export type Associable<M> =
  M extends ModelStatic<infer Source>
    ? {
        /**
         * Builds on-to-one association between two models
         * @param this source model with FK to target
         * @param target target model with FK to source
         * @param options one-to-one options
         */
        withOne: <Target extends State>(
          target: ModelStatic<Model<Target>>,
          options?: OneToOneOptions<Attributes<Source>, Target>,
        ) => Associable<M>;

        /**
         * Builds on-to-many association between parent/child models
         * @param this parent model with PK
         * @param child child model with FK
         * @param options one-to-many options
         */
        withMany: <Child extends State>(
          child: ModelStatic<Model<Child>>,
          options?: OneToManyOptions<Attributes<Source>, Child>,
        ) => Associable<M>;

        /**
         * Builds many-to-many association between three models (A->X<-B)
         * @param this cross-reference model with FKs to A and B
         * @param a X->A options
         * @param b X->B options
         */
        withManyToMany: <A extends State, B extends State>(
          a: ManyToManyOptions<Attributes<Source>, A>,
          b: ManyToManyOptions<Attributes<Source>, B>,
        ) => Associable<M>;

        // unsupported composite foreign key maps
        _fks: FkMap[];
      }
    : never;
