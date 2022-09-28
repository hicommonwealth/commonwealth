import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ChainAttributes, ChainInstance } from './chain';
import { ContractAttributes, ContractInstance } from './contract';
import { ModelStatic, ModelInstance } from './types';


export type CommunityContractAttributes = {
    id: number;
    chain_id: string;
    contract_id: number;

    // Associations
    Contract?: ContractAttributes;
    Chain?: ChainAttributes;
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
      chain_id: { type: dataTypes.STRING, allowNull: false },
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
      indexes: [
        { fields: ['chain_id'], unique: true },
      ],
    }
  );

  CommunityContract.associate = (models) => {
    models.CommunityContract.belongsTo(models.Contract, { foreignKey: 'contract_id', targetKey: 'id' });
    models.CommunityContract.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return CommunityContract;
};