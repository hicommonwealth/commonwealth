'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Quests',
        'quest_type',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Quests" SET quest_type = 'common'`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'Quests',
        'quest_type',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Quests',
        'scheduled_job_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Quests', 'quest_type');
  },
};
