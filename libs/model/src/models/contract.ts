import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type {
  CommunityContractAttributes,
  CommunityContractInstance,
} from './community_contract';
import type { ModelInstance, ModelStatic } from './types';

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

export default (sequelize: Sequelize.Sequelize) =>
  <ContractModelStatic>sequelize.define<ContractInstance>(
    'Contract',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      address: { type: Sequelize.STRING, allowNull: false },
      chain_node_id: { type: Sequelize.INTEGER, allowNull: false },
      decimals: { type: Sequelize.INTEGER, allowNull: true },
      token_name: { type: Sequelize.STRING, allowNull: true },
      symbol: { type: Sequelize.STRING, allowNull: true },
      type: { type: Sequelize.STRING, allowNull: true }, // for governance erc20, etc. formerly network
      abi_id: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      is_factory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      nickname: { type: Sequelize.STRING, allowNull: true },
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
