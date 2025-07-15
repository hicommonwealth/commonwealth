'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE TEMPORARY TABLE notif_to_delete AS
        SELECT id
        FROM "Notifications"
        WHERE notification_data::jsonb ? 'thread_id' AND
                (notification_data::jsonb ->> 'thread_id') NOT IN (SELECT id::text FROM "Threads");
      `,
        { raw: true, transaction: t }
      );

      await queryInterface.sequelize.query(
        `
          DELETE FROM "NotificationsRead"
          WHERE notification_id IN (SELECT id FROM notif_to_delete);
      `,
        { raw: true, transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "Notifications"
        WHERE id IN (SELECT id FROM notif_to_delete);
      `,
        { raw: true, transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DROP TABLE notif_to_delete;
      `,
        { raw: true, transaction: t }
      );

      await queryInterface.addColumn(
        'Notifications',
        'thread_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
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
