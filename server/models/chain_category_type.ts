import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface ChainCategoryTypeAttributes {
  id: number;
  category_name: string;
}

export interface ChainCategoryTypeInstance
  extends Model<ChainCategoryTypeAttributes>,
    ChainCategoryTypeAttributes {}

export type ChainCategoryTypeModelStatic =
  ModelStatic<ChainCategoryTypeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainCategoryTypeModelStatic => {
  const ChainCategoryType = <ChainCategoryTypeModelStatic>sequelize.define(
    'ChainCategoryType',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category_name: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ChainCategoryTypes',
      timestamps: false,
      underscored: true,
    }
  );

  return ChainCategoryType;
};
