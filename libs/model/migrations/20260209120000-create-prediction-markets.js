'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PredictionMarkets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      eth_chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      proposal_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      market_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vault_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      governor_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      router_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      strategy_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      p_token_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      f_token_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      collateral_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      creator_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'draft',
      },
      winner: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      resolution_threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_collateral: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
        defaultValue: 0,
      },
      current_probability: {
        type: Sequelize.FLOAT,
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
    });

    await queryInterface.createTable('PredictionMarketTrades', {
      prediction_market_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'PredictionMarkets',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
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
      trader_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      collateral_amount: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      p_token_amount: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      f_token_amount: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.createTable('PredictionMarketPositions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      prediction_market_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'PredictionMarkets',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('PredictionMarkets', ['thread_id']);
    await queryInterface.addIndex('PredictionMarkets', ['market_id']);
    await queryInterface.addIndex('PredictionMarkets', ['status']);
    await queryInterface.addIndex('PredictionMarkets', ['vault_address']);
    await queryInterface.addIndex('PredictionMarketTrades', ['trader_address']);
    await queryInterface.addIndex('PredictionMarketTrades', [
      'prediction_market_id',
    ]);
    await queryInterface.addIndex('PredictionMarketPositions', [
      'prediction_market_id',
    ]);
    await queryInterface.addIndex(
      'PredictionMarketPositions',
      ['prediction_market_id', 'user_address'],
      {
        unique: true,
        name: 'prediction_market_positions_market_user_unique',
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PredictionMarketPositions');
    await queryInterface.dropTable('PredictionMarketTrades');
    await queryInterface.dropTable('PredictionMarkets');
  },
};
