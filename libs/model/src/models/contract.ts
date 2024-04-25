import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type {
  CommunityContractAttributes,
  CommunityContractInstance,
} from './community_contract';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type ContractAttributes = {
  id?: number;
  address: string;
  chain_node_id: number;
  abi_id?: number;
  decimals?: number;
  token_name?: string;
  symbol?: string;
  type?: string;
  is_factory?: boolean;
  nickname?: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  ChainNode?: ChainNodeAttributes;
  CommunityContract?: CommunityContractAttributes;
};

export type ContractInstance = ModelInstance<ContractAttributes> & {
  getChainNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
  getCommunityContract: Sequelize.BelongsToGetAssociationMixin<CommunityContractInstance>;
};

export type ContractModelStatic = ModelStatic<ContractInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): ContractModelStatic => {
  const Contract = <ContractModelStatic>sequelize.define(
    'Contract',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      address: { type: dataTypes.STRING, allowNull: false },
      chain_node_id: { type: dataTypes.INTEGER, allowNull: false },
      decimals: { type: dataTypes.INTEGER, allowNull: true },
      token_name: { type: dataTypes.STRING, allowNull: true },
      symbol: { type: dataTypes.STRING, allowNull: true },
      type: { type: dataTypes.STRING, allowNull: true }, // for governance erc20, etc. formerly network
      abi_id: { type: dataTypes.INTEGER, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      is_factory: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      nickname: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'Contracts',
      indexes: [
        {
          fields: ['address'],
        },
      ],
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  Contract.associate = (models) => {
    models.Contract.belongsTo(models.ChainNode, {
      foreignKey: 'chain_node_id',
      targetKey: 'id',
    });
    models.Contract.belongsTo(models.ContractAbi, {
      foreignKey: 'abi_id',
      targetKey: 'id',
    });
  };

  return Contract;
};
