import { BuildOptions, Model } from 'sequelize';

interface TypedModel<Attrs extends Record<string, unknown>> extends Model<Attrs> {
  toJSON(): Attrs;
}

export type ModelInstance<Attrs extends Record<string, unknown>> = TypedModel<Attrs> & Attrs;

export type ModelStatic<T extends Model> = typeof Model
  & { associate: (models: any) => void }
  & { new(values?: Record<string, unknown>, options?: BuildOptions): T }
