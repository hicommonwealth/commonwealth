import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

type Market = z.infer<typeof schemas.Market>;

export const Market = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<Market>> =>
  sequelize.define<ModelInstance<Market>>(
    'Market',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      question: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open',
      },
      image_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'Markets',
    },
  );

type CommunityMarket = {
  community_id: string;
  market_id: number;
  subscribed_at: Date;
};

export const CommunityMarket = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<CommunityMarket>> =>
  sequelize.define<ModelInstance<CommunityMarket>>(
    'CommunityMarket',
    {
      community_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      market_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      subscribed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'CommunityMarkets',
    },
  );
