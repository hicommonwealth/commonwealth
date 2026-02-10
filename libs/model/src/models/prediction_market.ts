import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type PredictionMarketAttributes = z.infer<
  typeof schemas.PredictionMarket
>;
export type PredictionMarketInstance =
  ModelInstance<PredictionMarketAttributes>;

export const PredictionMarket = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PredictionMarketInstance> =>
  sequelize.define<PredictionMarketInstance>(
    'PredictionMarket',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      eth_chain_id: { type: Sequelize.INTEGER, allowNull: false },
      proposal_id: { type: Sequelize.STRING, allowNull: true },
      market_id: { type: Sequelize.STRING, allowNull: true },
      vault_address: { type: Sequelize.STRING, allowNull: true },
      governor_address: { type: Sequelize.STRING, allowNull: true },
      router_address: { type: Sequelize.STRING, allowNull: true },
      strategy_address: { type: Sequelize.STRING, allowNull: true },
      p_token_address: { type: Sequelize.STRING, allowNull: true },
      f_token_address: { type: Sequelize.STRING, allowNull: true },
      collateral_address: { type: Sequelize.STRING, allowNull: false },
      creator_address: { type: Sequelize.STRING, allowNull: false },
      prompt: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: schemas.PredictionMarketStatus.Draft,
      },
      winner: { type: Sequelize.INTEGER, allowNull: true },
      duration: { type: Sequelize.INTEGER, allowNull: false },
      resolution_threshold: { type: Sequelize.FLOAT, allowNull: false },
      start_time: { type: Sequelize.DATE, allowNull: true },
      end_time: { type: Sequelize.DATE, allowNull: true },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      total_collateral: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
        defaultValue: 0,
      },
      current_probability: { type: Sequelize.FLOAT, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'PredictionMarkets',
      indexes: [
        { fields: ['thread_id'] },
        { fields: ['market_id'] },
        { fields: ['status'] },
        { fields: ['vault_address'] },
      ],
    },
  );

export type PredictionMarketTradeAttributes = z.infer<
  typeof schemas.PredictionMarketTrade
>;
export type PredictionMarketTradeInstance =
  ModelInstance<PredictionMarketTradeAttributes>;

export const PredictionMarketTrade = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PredictionMarketTradeInstance> =>
  sequelize.define<PredictionMarketTradeInstance>(
    'PredictionMarketTrade',
    {
      prediction_market_id: { type: Sequelize.INTEGER, allowNull: false },
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
      trader_address: { type: Sequelize.STRING, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      collateral_amount: { type: Sequelize.DECIMAL(78, 0), allowNull: false },
      p_token_amount: { type: Sequelize.DECIMAL(78, 0), allowNull: false },
      f_token_amount: { type: Sequelize.DECIMAL(78, 0), allowNull: false },
      timestamp: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'PredictionMarketTrades',
      indexes: [
        { fields: ['trader_address'] },
        { fields: ['prediction_market_id'] },
      ],
    },
  );

export type PredictionMarketPositionAttributes = z.infer<
  typeof schemas.PredictionMarketPosition
>;
export type PredictionMarketPositionInstance =
  ModelInstance<PredictionMarketPositionAttributes>;

export const PredictionMarketPosition = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PredictionMarketPositionInstance> =>
  sequelize.define<PredictionMarketPositionInstance>(
    'PredictionMarketPosition',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      prediction_market_id: { type: Sequelize.INTEGER, allowNull: false },
      user_address: { type: Sequelize.STRING, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      p_token_balance: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
        defaultValue: 0,
      },
      f_token_balance: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
        defaultValue: 0,
      },
      total_collateral_in: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'PredictionMarketPositions',
      indexes: [
        {
          name: 'prediction_market_positions_market_user_unique',
          fields: ['prediction_market_id', 'user_address'],
          unique: true,
        },
        { fields: ['prediction_market_id'] },
      ],
    },
  );
