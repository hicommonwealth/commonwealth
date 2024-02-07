import type { BuildOptions, Model } from 'sequelize';
import type { DB } from '.';

export type ModelInstance<Attrs extends Record<string, unknown>> =
  Model<Attrs> & Attrs;

export type ModelStatic<T extends Model> = typeof Model & {
  associate: (models: DB) => void;
} & { new (values?: Record<string, unknown>, options?: BuildOptions): T };
