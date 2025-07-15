'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'XpLogs',
        {
          user_id: {
            primaryKey: true,
            type: Sequelize.INTEGER,
            references: {
              model: 'Users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          created_at: { type: Sequelize.DATE, primaryKey: true },
          event_name: { type: Sequelize.STRING, primaryKey: true },
          xp_points: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'xp_points',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('XpLogs', { transaction });
      await queryInterface.removeColumn('Users', 'xp_points', {
        transaction,
      });
    });
  },
};
