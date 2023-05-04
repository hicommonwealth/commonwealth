'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Notifications',
        'thread_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Threads', key: 'id' },
        },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications"
        SET thread_id = (notification_data::jsonb->>'thread_id')::INTEGER
        WHERE notification_data::jsonb->>'thread_id' IS NOT NULL;
      `,
        { raw: true, transaction: t }
      );

      await queryInterface.addIndex('Notifications', ['thread_id'], {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Notifications', 'thread_id');
  },
};
