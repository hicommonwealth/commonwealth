import type {
  BalanceType,
  CosmosGovernanceVersion,
  NodeHealth,
} from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type ChainNodeAttributes = {
  url: string;
  id?: number;
  eth_chain_id?: number;
  cosmos_chain_id?: string;
  alt_wallet_url?: string;
  private_url?: string;
  balance_type: BalanceType;
  bech32?: string;
  cosmos_gov_version?: CosmosGovernanceVersion;
  ss58?: number;
  name: string;
  description?: string;
  health?: NodeHealth;
  updated_at?: Date;
};

export type ChainNodeInstance = ModelInstance<ChainNodeAttributes>;

export type ChainNodeModelStatic = ModelStatic<ChainNodeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainNodeModelStatic => {
  const ChainNode = <ChainNodeModelStatic>sequelize.define(
    'ChainNode',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: dataTypes.STRING, allowNull: false },
      eth_chain_id: { type: dataTypes.INTEGER, allowNull: true, unique: true },
      cosmos_chain_id: {
        type: dataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      alt_wallet_url: { type: dataTypes.STRING, allowNull: true },
      private_url: { type: dataTypes.STRING, allowNull: true },
      balance_type: { type: dataTypes.STRING, allowNull: false },
      name: { type: dataTypes.STRING, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: true },
      health: { type: dataTypes.STRING, allowNull: true },
      ss58: { type: dataTypes.INTEGER, allowNull: true },
      bech32: { type: dataTypes.STRING, allowNull: true },
      cosmos_gov_version: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'ChainNodes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: ['private_url'],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    },
  );

  ChainNode.associate = (models) => {
    models.ChainNode.hasMany(models.Community, { foreignKey: 'chain_node_id' });
  };

  return ChainNode;
};
