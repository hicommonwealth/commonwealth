import * as Sequelize from 'sequelize';

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
extends Sequelize.Instance<ContractItemAttributes>, ContractItemAttributes {

}

export interface ContractItemModel
extends Sequelize.Model<ContractItemInstance, ContractItemAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ContractItemModel => {
  const ContractItem = sequelize.define<ContractItemInstance, ContractItemAttributes>('ContractItem', {
    id:          { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    chain:       { type: dataTypes.STRING, allowNull: false },
    name:        { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    color:       { type: dataTypes.STRING, allowNull: false },
    category_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    underscored: true,
  });

  ContractItem.associate = (models) => {
    models.ContractItem.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ContractItem.belongsTo(models.ContractCategory, { foreignKey: 'category_id', targetKey: 'id' });
  };
  return ContractItem;
};
