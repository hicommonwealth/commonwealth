import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ChainInstance } from './chain';
import { ContractAttributes, ContractInstance } from './contract';
import { ModelStatic, ModelInstance } from './types';


export type CommunityContractAttributes = {
    id: number;
    community_id: string;
    contract_id: number;

    // Associations
    Contract?: ContractAttributes;
};

export type CommunityContractInstance = ModelInstance<CommunityContractAttributes> & {
  // add mixins as needed
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
  getContract: Sequelize.BelongsToGetAssociationMixin<ContractInstance>;
};

export type CommunityContractModelStatic = ModelStatic<CommunityContractInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityContractModelStatic => {
  const CommunityContract = <CommunityContractModelStatic>sequelize.define(
    'CommunityContract',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      contract_id: { type: dataTypes.INTEGER, allowNull: false }
    },
    {
      tableName: 'CommunityContracts',
      timestamps: true,
      underscored: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['community_id'], unique: true },
      ],
    }
  );

  CommunityContract.associate = (models) => {
    models.CommunityContract.belongsTo(models.Contract, { foreignKey: 'contract_id', targetKey: 'id' });
    models.CommunityContract.belongsTo(models.Chain, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return CommunityContract;
};