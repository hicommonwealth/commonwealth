'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'XpLogs',
        'referrer_user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'XpLogs',
        'referrer_xp_points',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('XpLogs', 'referrer_user_id', {
        transaction,
      });
      await queryInterface.removeColumn('XpLogs', 'referrer_xp_points', {
        transaction,
      });
    });
  },
};
