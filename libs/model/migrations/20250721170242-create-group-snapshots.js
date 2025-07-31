'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'GroupSnapshots',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          group_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Groups',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          block_height: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment:
              'Block height at which the snapshot was taken, null for latest',
          },
          snapshot_source: {
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Source type of the snapshot (e.g., sui_nft, eth_token)',
          },
          balance_map: {
            type: Sequelize.JSONB,
            allowNull: false,
            comment: 'JSON mapping of addresses to their balance amounts',
          },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'error', 'superseded'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Lifecycle status of the snapshot',
          },
          error_message: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Error message if status is error',
          },
          snapshot_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'When the snapshot was captured',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        {
          transaction,
          indexes: [
            {
              fields: ['group_id'],
              name: 'idx_group_snapshots_group_id',
            },
            {
              fields: ['status'],
              name: 'idx_group_snapshots_status',
            },
            {
              fields: ['group_id', 'status'],
              name: 'idx_group_snapshots_group_status',
            },
            {
              fields: ['snapshot_date'],
              name: 'idx_group_snapshots_snapshot_date',
            },
          ],
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('GroupSnapshots', { transaction });
    });
  },
};
