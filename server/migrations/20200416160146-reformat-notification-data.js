/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(`SELECT (id, notification_data) FROM "Notifications";`);
    await Promise.all(notifications[0].map(async (notif) => {
      const [id] = notif.row.slice(1, notif.row.length - 1).split(',');
      const notification_data = notif.row.slice(2 + id.length, notif.row.length - 1);
      const n_d = notification_data
        .replace('comment_id', 'object_id')
        .replace('comment_text', 'object_text')
        .replace('object_title', 'root_title');
      await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = '${n_d}' WHERE id=${Number(id)};`);
    }));
  },

  down: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(`SELECT (id, notification_data) FROM "Notifications";`);
    console.log(notifications);
    await Promise.all(notifications[0].forEach(async (notif) => {
      const [id, n_d] = notif.row.slice(1, notif.row.length - 1).split(',');
      let notification_data = JSON.parse(n_d);
      console.log(notification_data);
      if (notification_data.object_id.includes('comment-')) {
        notification_data['comment_id'] = notification.object_id.replace('comment-', '');
        delete notification_data.object_id;
        notification['comment_text'] = notifications.object_text;
        delete notification_data.object_text;
        console.log(notification_data);
        notification_data = JSON.stringify(notification_data);
        const q = `UPDATE "Notifications" SET notification_data=${notification_data} WHERE id=${Number(id)};`;
        await queryInterface.sequelize.query(q);
      }
    }));

    await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = REPLACE(notification_data, 'root_title', 'object_title');`);
  }
};
