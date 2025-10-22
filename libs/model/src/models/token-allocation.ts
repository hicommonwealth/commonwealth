import Sequelize from 'sequelize';
import { ModelInstance } from './types';

export type HistoricalAllocation = {
  user_id: number;
  num_threads: number;
  thread_score: number;
  num_comments: number;
  comment_score: number;
  num_reactions: number;
  reactions_score: number;
  unadjusted_score: number;
  adjusted_score: number;
  percent_allocation: number;
  token_allocation: number;
};
export const HistoricalAllocations = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<HistoricalAllocation>> =>
  sequelize.define<ModelInstance<HistoricalAllocation>>(
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
      tableName: 'HistoricalAllocations',
    },
  );

export type AuraAllocation = {
  user_id: number;
  total_xp: number;
  percent_allocation: number;
  token_allocation: number;
};
export const AuraAllocations = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<AuraAllocation>> =>
  sequelize.define<ModelInstance<AuraAllocation>>(
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
  address: string | null;
  magna_allocation_id: string | null;
  magna_synced_at: Date | null;
  magna_claimed_at: Date | null;
  magna_claim_data: string | null;
  magna_claim_tx_hash: string | null;
  magna_cliff_claimed_at: Date | null;
  magna_cliff_claim_data: string | null;
  magna_cliff_claim_tx_hash: string | null;
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
        allowNull: true,
      },
      magna_allocation_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      magna_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      magna_claimed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      magna_claim_data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      magna_claim_tx_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      magna_cliff_claimed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      magna_cliff_claim_data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      magna_cliff_claim_tx_hash: {
        type: Sequelize.STRING,
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
      tableName: 'ClaimAddresses',
    },
  );

type NftSnapshot = {
  token_id: number;
  user_id: number | null;
  user_tier: number | null;
  name: string | null;
  holder_address: string;
  opensea_url: string | null;
  traits: Record<string, unknown>;
  opensea_rarity: Record<string, unknown> | null;
  calculated_rarity: number | null;
  rarity_tier: number | null;
  equal_distribution_allocation: string | null;
  rarity_distribution_allocation: string | null;
  total_token_allocation: string | null;
  created_at: Date;
  updated_at: Date;
};

export const NftSnapshot = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ModelInstance<NftSnapshot>> =>
  sequelize.define<ModelInstance<NftSnapshot>>(
    'NftSnapshot',
    {
      token_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_tier: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      holder_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
      },
      opensea_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      traits: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      opensea_rarity: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      calculated_rarity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rarity_tier: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      equal_distribution_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      rarity_distribution_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      total_token_allocation: {
        type: Sequelize.DECIMAL,
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
      tableName: 'NftSnapshot',
    },
  );
