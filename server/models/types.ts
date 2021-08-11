import { BuildOptions, Model } from 'sequelize';

export type ModelStatic<T extends Model> = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): T }
