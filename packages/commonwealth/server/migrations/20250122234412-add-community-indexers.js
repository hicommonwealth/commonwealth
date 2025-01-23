'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'CommunityIndexers',
        {
          id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
          },
          status: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          last_checked: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'CommunityIndexers',
        [
          {
            id: 'clanker',
            status: 'idle',
            last_checked: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'CommunityIndexers',
        { id: 'clanker' },
        { transaction },
      );
      await queryInterface.dropTable('CommunityIndexers', { transaction });
    });
  },
};
