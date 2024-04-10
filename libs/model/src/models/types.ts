import { DataTypes, Model, Sequelize, type BuildOptions } from 'sequelize';

type ModelFactory<T> = (sequelize: Sequelize, dataTypes: typeof DataTypes) => T;
type ModelFactories = Record<string, ModelFactory<unknown>>;
export type Models<T extends ModelFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type ModelInstance<Attrs extends Record<string, unknown>> =
  Model<Attrs> & Attrs;

export type ModelStatic<T extends Model> = typeof Model & {
  associate: (models: Models<any>) => void;
} & { new (values?: Record<string, unknown>, options?: BuildOptions): T };
