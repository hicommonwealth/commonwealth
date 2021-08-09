import { ModelDefined } from 'sequelize';

export type ModelStatic<S, T> = ModelDefined<S, T>
    & { associate: (models: { [name: string]: ModelDefined<any, any> }) => void };
