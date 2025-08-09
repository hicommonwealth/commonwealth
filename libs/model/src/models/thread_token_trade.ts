import { LaunchpadTrade } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ThreadTokenTradeAttributes = z.infer<typeof LaunchpadTrade>;

export type ThreadTokenTradeInstance =
  ModelInstance<ThreadTokenTradeAttributes>;

export type ThreadTokenTradeModelStatic =
  Sequelize.ModelStatic<ThreadTokenTradeInstance>;

export default (sequelize: Sequelize.Sequelize): ThreadTokenTradeModelStatic =>
  <ThreadTokenTradeModelStatic>sequelize.define<ThreadTokenTradeInstance>(
    'ThreadTokenTokenTraded',
    {
      eth_chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      transaction_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      token_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trader_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_buy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      community_token_amount: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      floating_supply: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'ThreadTokenTrades',
      underscored: true,
      indexes: [{ fields: ['token_address'] }],
    },
  );
