'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Remove thread_id column from ChainEntityMeta table
      await queryInterface.removeColumn('ChainEntityMeta', 'thread_id', {
        transaction,
      });

      // Remove LinkedThreads table
      await queryInterface.dropTable('LinkedThreads', { transaction });

      // Remove snapshotProposal column from Threads table
      await queryInterface.removeColumn('Threads', 'snapshot_proposal', {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Recreate LinkedThreads table
      await queryInterface.createTable(
        'LinkedThreads',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          linked_thread: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          linking_thread: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction }
      );

      // Add thread_id column back to ChainEntityMeta table
      await queryInterface.addColumn(
        'ChainEntityMeta',
        'thread_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );

      // Add snapshotProposal column back to Threads table
      await queryInterface.addColumn(
        'Threads',
        'snapshot_proposal',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );
    });
  },
};
