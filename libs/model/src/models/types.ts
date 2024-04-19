import {
  Model,
  Sequelize,
  DataTypes as SequelizeDataTypes,
  type BuildOptions,
} from 'sequelize';

type ModelFactory<T> = (sequelize: Sequelize, dataTypes: DataTypes) => T;
type ModelFactories = Record<string, ModelFactory<unknown>>;
export type Models<T extends ModelFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type ModelInstance<Attrs extends Record<string, unknown>> =
  Model<Attrs> & Attrs;

export type ModelStatic<T extends Model> = typeof Model & {
  associate: (models: Models<any>) => void;
} & { new (values?: Record<string, unknown>, options?: BuildOptions): T };

/**
 * Composite key mappings (must match field names in parent and child)
 */
export type State = Record<string, unknown>;
export type CompositeKey<Parent extends State, Child extends State> = Array<
  keyof Parent & keyof Child & string
>;
export type CompositeMap<Parent extends State, Child extends State> = {
  parent: ModelStatic<Model<Parent>>;
  child: ModelStatic<Model<Child>>;
  key: CompositeKey<Parent, Child>;
};

/**
 * Reexported DataTypes. Avoids ts build error with `typeof DataTypes`
 */
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

/**
 * Canvas shared model attributes
 */
export type CanvasModelAttributes = {
  canvas_signed_data: string;
  canvas_hash: string;
};

export const canvasModelSequelizeColumns = (dataTypes: DataTypes) => ({
  canvas_signed_data: { type: dataTypes.JSONB, allowNull: true },
  canvas_hash: { type: dataTypes.STRING, allowNull: true },
});
