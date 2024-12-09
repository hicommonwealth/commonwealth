import { ChainNode } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { buildChainNodeUrl } from '../utils/utils';
import type { ModelInstance } from './types';

export type ChainNodeAttributes = z.infer<typeof ChainNode>;

export type ChainNodeInstance = ModelInstance<ChainNodeAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ChainNodeInstance> =>
  sequelize.define<ChainNodeInstance>(
    'ChainNode',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        get() {
          const url: string | null | undefined = this.getDataValue('url');
          if (!url) return url;
          return buildChainNodeUrl(url, 'public');
        },
      },
      eth_chain_id: { type: Sequelize.INTEGER, allowNull: true, unique: true },
      cosmos_chain_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      alt_wallet_url: {
        type: Sequelize.STRING,
        allowNull: true,
        get() {
          const url: string | null | undefined =
            this.getDataValue('alt_wallet_url');
          if (!url) return url;
          return buildChainNodeUrl(url, 'public');
        },
      },
      private_url: {
        type: Sequelize.STRING,
        allowNull: true,
        get() {
          const privateUrl: string | null | undefined =
            this.getDataValue('private_url');
          if (!privateUrl) return privateUrl;
          return buildChainNodeUrl(privateUrl, 'private');
        },
      },
      balance_type: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      health: { type: Sequelize.STRING, allowNull: true },
      ss58: { type: Sequelize.INTEGER, allowNull: true },
      bech32: { type: Sequelize.STRING, allowNull: true },
      cosmos_gov_version: { type: Sequelize.STRING(64), allowNull: true },
      block_explorer: { type: Sequelize.STRING, allowNull: true },
      slip44: { type: Sequelize.INTEGER, allowNull: true },
      max_ce_block_range: { type: Sequelize.INTEGER, allowNull: true },
      alchemy_metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ChainNodes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: ['private_url', 'max_ce_block_range'],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    },
  );
