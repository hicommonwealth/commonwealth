import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { CommunityAttributes, CommunityInstance } from './community';
import type { ContractAttributes, ContractInstance } from './contract';
import type { ModelInstance } from './types';

export type CommunityContractAttributes = {
  id?: number;
  community_id: string;
  contract_id: number;
  created_at: Date;
  updated_at: Date;

  // Associations
  Contract?: ContractAttributes;
  Community?: CommunityAttributes;
};

export type CommunityContractInstance =
  ModelInstance<CommunityContractAttributes> & {
    getCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
    getContract: Sequelize.BelongsToGetAssociationMixin<ContractInstance>;
  };

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityContractInstance> =>
  sequelize.define<CommunityContractInstance>(
    'CommunityContract',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      contract_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'CommunityContracts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
