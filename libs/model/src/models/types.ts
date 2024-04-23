import { DataTypes, Model, Sequelize, type BuildOptions } from 'sequelize';

type ModelFactory<T> = (sequelize: Sequelize, dataTypes: typeof DataTypes) => T;
type ModelFactories = Record<string, ModelFactory<unknown>>;
export type Models<T extends ModelFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type State = Record<string, unknown>;
export type ModelInstance<Attrs extends State> = Model<Attrs> & Attrs;
export type ModelStatic<ParentModel extends Model> =
  typeof Model<ParentModel> & {
    associate: (models: Models<any>) => void;
    withMany: <Child extends State>(
      child: ModelStatic<Model<Child>>,
      foreignKey: keyof Child & string,
      options?: { as?: string; optional?: boolean },
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
