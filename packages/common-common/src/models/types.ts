import { BuildOptions, Model } from 'sequelize';
import { DB } from 'commonwealth/server/database';

export type ModelInstance<Attrs extends Record<string, unknown>> = Model<Attrs> & Attrs;

export type ModelStatic<T extends Model> = typeof Model
  & { associate: (models: DB) => void }
  & { new(values?: Record<string, unknown>, options?: BuildOptions): T };
