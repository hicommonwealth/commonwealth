'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ReferralFees',
        'referee_address',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ReferralFees', 'referee_address');
  },
};
