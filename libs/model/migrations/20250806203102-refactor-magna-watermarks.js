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
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('ClaimAddresses', 'address', {
        type: Sequelize.STRING,
        allowNull: false,
        transaction,
      });
    });
  },
};
