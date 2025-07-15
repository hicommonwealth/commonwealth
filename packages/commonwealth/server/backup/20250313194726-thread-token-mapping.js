'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Threads',
        'launchpad_token_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Threads',
        'is_linking_token',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.addIndex('Threads', ['is_linking_token'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('Threads', ['is_linking_token'], {
        transaction,
      });

      await queryInterface.removeColumn('Threads', 'is_linking_token', {
        transaction,
      });

      await queryInterface.removeColumn('Threads', 'launchpad_token_address', {
        transaction,
      });
    });
  },
};
