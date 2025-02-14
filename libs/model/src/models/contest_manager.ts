import { ContestManager } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance } from './types';

export type ContestManagerAttributes = z.infer<typeof ContestManager> & {
  // associations
  Community?: CommunityAttributes;
};

type ContestManager = ModelInstance<ContestManagerAttributes>;

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
      description: {
        type: Sequelize.STRING,
        allowNull: true,
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
      ending: { type: Sequelize.BOOLEAN },
      farcaster_frame_url: { type: Sequelize.STRING, allowNull: true },
      farcaster_frame_hashes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      neynar_webhook_id: { type: Sequelize.STRING, allowNull: true },
      neynar_webhook_secret: { type: Sequelize.STRING, allowNull: true },
      topic_id: { type: Sequelize.INTEGER, allowNull: true },
      is_farcaster_contest: { type: Sequelize.BOOLEAN, allowNull: false },
      vote_weight_multiplier: { type: Sequelize.FLOAT, allowNull: true },
      farcaster_author_cast_hash: { type: Sequelize.STRING, allowNull: true },
    },
    {
      tableName: 'ContestManagers',
      timestamps: false,
      indexes: [],
    },
  );
