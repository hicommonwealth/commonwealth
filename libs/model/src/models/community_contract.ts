import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes, CommunityInstance } from './community';
import type { ContractAttributes, ContractInstance } from './contract';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractAttributes = {
  id?: number;
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
): CommunityContractModelStatic =>
  <CommunityContractModelStatic>sequelize.define<CommunityContractInstance>(
    'CommunityContract',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      contract_id: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'CommunityContracts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
