import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface ContractCategoryAttributes {
  name: string;
  description: string;
  color: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContractCategoryInstance
extends Model<ContractCategoryAttributes>, ContractCategoryAttributes {}

export type ContractCategoryModelStatic = ModelStatic<ContractCategoryInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ContractCategoryModelStatic => {
  const ContractCategory = <ContractCategoryModelStatic>sequelize.define('ContractCategory', {
    id:          { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:        { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    color:       { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'ContractCategories',
    underscored: true,
  });

  return ContractCategory;
};
