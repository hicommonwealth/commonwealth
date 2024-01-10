import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes, CommunityInstance } from './community';
import type { ContractAttributes, ContractInstance } from './contract';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractAttributes = {
  id: number;
  community_id: string;
  contract_id: number;

  // Associations
  Contract?: ContractAttributes;
  Community?: CommunityAttributes;
};

export type CommunityContractInstance =
  ModelInstance<CommunityContractAttributes> & {
    getCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
    getContract: Sequelize.BelongsToGetAssociationMixin<ContractInstance>;
  };

export type CommunityContractModelStatic =
  ModelStatic<CommunityContractInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityContractModelStatic => {
  const CommunityContract = <CommunityContractModelStatic>sequelize.define(
    'CommunityContract',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      contract_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'CommunityContracts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['community_id'], unique: true }],
    },
  );

  CommunityContract.associate = (models) => {
    models.CommunityContract.belongsTo(models.Contract, {
      foreignKey: 'contract_id',
      targetKey: 'id',
    });
    models.CommunityContract.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return CommunityContract;
};
