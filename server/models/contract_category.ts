import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ContractCategoryAttributes = {
  name: string;
  description: string;
  color: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type ContractCategoryInstance = ModelInstance<ContractCategoryAttributes> & {};

export type ContractCategoryModelStatic = ModelStatic<ContractCategoryInstance>;

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
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  return ContractCategory;
};
