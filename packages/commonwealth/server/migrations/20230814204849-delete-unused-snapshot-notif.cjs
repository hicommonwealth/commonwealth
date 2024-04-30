'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      WITH notif_id_to_keep as (SELECT DISTINCT notification_id
                          FROM "NotificationsRead" NR
                                   JOIN "Notifications" N ON N.id = NR.notification_id
                          WHERE N.category_id = 'snapshot-proposal')
      DELETE
      FROM "Notifications"
          WHERE id NOT IN (SELECT * FROM notif_id_to_keep) AND category_id = 'snapshot-proposal';
    `);
  },

  down: async (queryInterface, Sequelize) => {},
};
