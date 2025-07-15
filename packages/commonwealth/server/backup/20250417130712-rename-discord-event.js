'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          UPDATE "QuestActionMetas"
          SET event_name = 'DiscordServerJoined'
          WHERE event_name = 'CommonDiscordServerJoined'
        `,
        { transaction },
      );
      await queryInterface.addColumn(
        'QuestActionMetas',
        'start_link',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "QuestActionMetas"
        SET event_name = 'CommonDiscordServerJoined'
        WHERE event_name = 'DiscordServerJoined'
      `,
        { transaction },
      );
      await queryInterface.removeColumn('QuestActionMetas', 'start_link', {
        transaction,
      });
    });
  },
};
