import Sequelize from 'sequelize';
import { ModelInstance } from './types';

export const HistoricalAllocations = (sequelize: Sequelize.Sequelize) =>
  sequelize.define(
    'HistoricalAllocations',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      num_threads: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      thread_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      num_comments: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      num_reactions: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reactions_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      unadjusted_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      adjusted_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      percent_score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      token_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      magna_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: 'HistoricalAllocations',
    },
  );

export const AuraAllocations = (sequelize: Sequelize.Sequelize) =>
  sequelize.define(
    'AuraAllocations',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      total_xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      percent_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      token_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'AuraAllocations',
    },
  );

type ClaimAddress = {
  user_id: number;
  address: string;
  created_at: Date;
  updated_at: Date;
};
export const ClaimAddresses = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<ClaimAddress>> =>
  sequelize.define<ModelInstance<ClaimAddress>>(
    'ClaimAddresses',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      address: {
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
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'ClaimAddresses',
    },
  );
