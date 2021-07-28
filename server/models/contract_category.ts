import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface ContractCategoryAttributes {
  id?: number;
  name: string;
  description: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContractCategoryInstance
extends Model<ContractCategoryAttributes>, ContractCategoryAttributes {}

type ContractCategoryModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): ContractCategoryInstance }

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
