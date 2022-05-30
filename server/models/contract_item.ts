import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

import { CommunityAttributes } from './community';
import { ContractCategoryAttributes } from './contract_category';

export type ContractItemAttributes = {
  community_id: string;
  name: string;
  description: string;
  color: string;
  category_id: number;
  id?: number;
  created_at?: Date;
  updated_at?: Date;
  Community?: CommunityAttributes;
  ContractCategory?: ContractCategoryAttributes;
}

export type ContractItemInstance = ModelInstance<ContractItemAttributes>;

export type ContractItemModelStatic = ModelStatic<ContractItemInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ContractItemModelStatic => {
  const ContractItem = <ContractItemModelStatic>sequelize.define('ContractItem', {
    id:          { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    community_id:       { type: dataTypes.STRING, allowNull: false },
    name:        { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    color:       { type: dataTypes.STRING, allowNull: false },
    category_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'ContractItems',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  ContractItem.associate = (models) => {
    models.ContractItem.belongsTo(models.Community, { foreignKey: 'community_id', targetKey: 'id' });
    models.ContractItem.belongsTo(models.ContractCategory, { foreignKey: 'category_id', targetKey: 'id' });
  };
  return ContractItem;
};
