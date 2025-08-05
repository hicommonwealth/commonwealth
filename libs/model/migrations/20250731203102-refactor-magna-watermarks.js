'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('ClaimAddresses', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
        transaction,
      });
      await queryInterface.addColumn('ClaimAddresses', 'magna_allocation_id', {
        type: Sequelize.STRING,
        allowNull: true,
        transaction,
      });
      await queryInterface.addColumn('ClaimAddresses', 'magna_synced_at', {
        type: Sequelize.DATE,
        allowNull: true,
        transaction,
      });
      await queryInterface.removeColumn(
        'HistoricalAllocations',
        'magna_synced_at',
        {
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('ClaimAddresses', 'address', {
        type: Sequelize.STRING,
        allowNull: false,
        transaction,
      });
      await queryInterface.removeColumn(
        'ClaimAddresses',
        'magna_allocation_id',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('ClaimAddresses', 'magna_synced_at', {
        transaction,
      });
      await queryInterface.addColumn(
        'HistoricalAllocations',
        'magna_synced_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          transaction,
        },
      );
    });
  },
};
