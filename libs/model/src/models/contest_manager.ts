import { ContestManager } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

type ContestManager = ModelInstance<z.infer<typeof ContestManager>>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ContestManager> =>
  sequelize.define<ContestManager>(
    'ContestManager',
    {
      contest_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      funding_token_address: { type: Sequelize.STRING },
      prize_percentage: { type: Sequelize.INTEGER },
      payout_structure: { type: Sequelize.ARRAY(Sequelize.INTEGER) },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      ticker: { type: Sequelize.STRING },
      decimals: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      cancelled: { type: Sequelize.BOOLEAN },
      ended: { type: Sequelize.BOOLEAN },
      farcaster_frame_url: { type: Sequelize.STRING, allowNull: true },
      farcaster_frame_hashes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      neynar_webhook_id: { type: Sequelize.STRING, allowNull: true },
      topic_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: 'ContestManagers',
      timestamps: false,
      indexes: [],
    },
  );
