'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Communities', 'namespace_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        transaction,
      });

      await queryInterface.addIndex('Communities', ['namespace_address'], {
        name: 'communities_namespace_address_idx',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Communities',
        'communities_namespace_address_idx',
        { transaction },
      );

      await queryInterface.removeColumn('Communities', 'namespace_verified', {
        transaction,
      });
    });
  },
};
