import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

import { ChainAttributes } from './chain';
import { ContractCategoryAttributes } from './contract_category';

export interface ContractItemAttributes {
  id?: number;
  chain: string;
  name: string;
  description: string;
  color: string;
  category_id: number;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
  ContractCategory?: ContractCategoryAttributes;
}

export interface ContractItemInstance
extends Model<ContractItemAttributes>, ContractItemAttributes {}

type ContractItemModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): ContractItemInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ContractItemModelStatic => {
  const ContractItem = <ContractItemModelStatic>sequelize.define('ContractItem', {
    id:          { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    chain:       { type: dataTypes.STRING, allowNull: false },
    name:        { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    color:       { type: dataTypes.STRING, allowNull: false },
    category_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'ContractItems',
    underscored: true,
  });

  ContractItem.associate = (models) => {
    models.ContractItem.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ContractItem.belongsTo(models.ContractCategory, { foreignKey: 'category_id', targetKey: 'id' });
  };
  return ContractItem;
};
