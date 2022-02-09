import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface ChainCategoryAttributes {
  id: number;
  category_name: string;
}

export interface ChainCategoryInstance
extends Model<ChainCategoryAttributes>, ChainCategoryAttributes {}

export type ChainCategoryModelStatic = ModelStatic<ChainCategoryInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainCategoryModelStatic => {
  const ChainCategory = <ChainCategoryModelStatic>sequelize.define('ChainCategories', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    chain_id: { type: dataTypes.STRING, allowNull: false, references: { model: "Chains", key: "id" }},
    category_type_id: {
      type: dataTypes.INTEGER, allowNull: false, references: { model: "ChainCategoryTypes", key: "id" }
    }
  }, {
    tableName: 'ChainCategory',
    timestamps: false,
    underscored: true,
  });

  ChainCategory.associate = (models) => {
      models.ChainCategory.hasOne(models.ChainCategoryType); // TODO: is this right?
  };

  return ChainCategory;
};
