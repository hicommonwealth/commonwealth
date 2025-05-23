import { LaunchpadToken } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type { ModelInstance } from './types';

export type LaunchpadTokenAttributes = z.infer<typeof LaunchpadToken> & {
  // associations
  ChainNode?: ChainNodeAttributes;
};

export type LaunchpadTokenInstance = ModelInstance<LaunchpadTokenAttributes> & {
  // add mixins as needed
  getChainNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
};

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<LaunchpadTokenInstance> =>
  sequelize.define<LaunchpadTokenInstance>(
    'LaunchpadToken',
    {
      // derivable when event received
      token_address: { type: Sequelize.STRING, primaryKey: true },
      namespace: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      symbol: { type: Sequelize.STRING, allowNull: false },
      initial_supply: { type: Sequelize.INTEGER, allowNull: false },
      liquidity_transferred: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      launchpad_liquidity: { type: Sequelize.DECIMAL(78, 0), allowNull: false },
      eth_market_cap_target: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      creator_address: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },

      // optional after token linked
      description: { type: Sequelize.STRING, allowNull: true },
      icon_url: { type: Sequelize.STRING, allowNull: true },
    },
    {
      tableName: 'LaunchpadTokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );
