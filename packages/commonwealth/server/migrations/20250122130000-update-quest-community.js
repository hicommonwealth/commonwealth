'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Quests',
        'community_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Quests',
        'community_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );
    });
  },
};
