/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(
      `SELECT * FROM "Notifications";`
    );
    await Promise.all(
      notifications[0].map(async (notif) => {
        let data = JSON.parse(notif.notification_data);
        if (data.thread_id) {
          data['root_id'] = Number(data.thread_id);
          data['root_type'] = 'discussion';
          data['root_title'] = data.thread_title;
          delete data.thread_id;
          delete data.thread_title;
        } else if (data.comment_id) {
          const root = data.object_id || data.root_id;
          if (!root) {
            console.error(
              `Comment without object_id or root_id: ${data.comment_id}`
            );
            return;
          }
          const [prefix, id] = root.split('_');
          data['root_id'] = Number(id);
          data['root_type'] = prefix;
          data['root_title'] = data.object_title;
          data.comment_id = Number(data.comment_id);
          delete data.object_id;
          delete data.object_title;
        } else {
          // Shouldn't exist, i.e. implies misformatting
          console.error(data);
        }
        // Escape JSON single quotemarks by doubling
        data = JSON.stringify(data).replace(/'/g, `''`);
        const query = `UPDATE "Notifications" SET notification_data='${data}' WHERE id=${Number(
          notif.id
        )};`;
        await queryInterface.sequelize.query(query);
      })
    );
  },

  down: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(
      `SELECT * FROM "Notifications";`
    );
    await Promise.all(
      notifications[0].map(async (notif) => {
        let data = JSON.parse(notif.notification_data);
        if (data.comment_id) {
          data['object_id'] = `${data.root_type}_${data.root_id}`;
          console.log(data.object_id);
          data['object_title'] = data.root_title;
        } else if (data.root_id) {
          data['thread_id'] = data.root_id;
          data['thread_title'] = data.root_title;
        } else {
          // Shouldn't exist, i.e. implies misformatting
          console.error(data);
        }
        delete data.root_id;
        delete data.root_title;
        delete data.root_type;
        data = JSON.stringify(data).replace(/'/g, `''`);
        const query = `UPDATE "Notifications" SET notification_data = '${data}' WHERE id=${Number(
          notif.id
        )};`;
        await queryInterface.sequelize.query(query);
      })
    );
  },
};
