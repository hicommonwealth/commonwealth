import { ThreadToken } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ThreadTokenAttributes = z.infer<typeof ThreadToken>;

export type ThreadTokenInstance = ModelInstance<ThreadTokenAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ThreadTokenInstance> =>
  sequelize.define<ThreadTokenInstance>(
    'ThreadToken',
    {
      token_address: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      thread_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      initial_supply: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      liquidity_transferred: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      launchpad_liquidity: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      eth_market_cap_target: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      creator_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'ThreadTokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );
