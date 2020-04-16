/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(`SELECT * FROM "Notifications";`);
    await Promise.all(notifications[0].map(async (notif) => {
      const { notification_data } = notif;
      let data = JSON.parse(notification_data);
      if (data.thread_id) {
        data['root_id'] = Number(data.thread_id);
        data['root_type'] = 'discussion';
        data['root_title'] = data.thread_title;
        delete data.thread_id;
        delete data.thread_title;
      } else if (data.comment_id) {
        const [prefix, id] = data.object_id.split("_");
        data['root_id'] = Number(id);
        data['root_type'] = prefix;
        data['root_title'] = data.object_title;
        data.comment_id = Number(data.comment_id);
        delete data.object_id;
        delete data.object_title;
      } else {
        console.log(data); // Shouldn't exist
      }
      data = JSON.stringify(data).replace(/'/g, `''`);
      const query = `UPDATE "Notifications" SET notification_data='${data}' WHERE id=${Number(notif.id)};`;
      await queryInterface.sequelize.query(query);
    }));
  },

  down: async (queryInterface, Sequelize) => {
    // if object_id === root_id, it's a thread
    // if it's a thread:
    //  // data.root_title --> thread_title
    //  // data.root_id --> thread_id
    //  // delete data.root_id
    //  // delete data.root_title
    //  // delete data.object_id
    // if it isn't a thread:
    //  // data.object_text --> data.comment_text
    //  // data.object_id --> data.comment_id
    //  // data.root_title --> data.object_title
    //  // data.root_id --> data.object_id
    //  // delete data.object_text;
    //  // delete data.object_id;
    //  // delete data.root_title;
    //  // delete data.root_id;

    const notifications = await queryInterface.sequelize.query(`SELECT (id, notification_data) FROM "Notifications";`);
    console.log(notifications);
    await Promise.all(notifications[0].map(async (notif) => {
      const [id] = notif.row.slice(1, notif.row.length - 1).split(',');
      const notification_data = notif.row.slice(2 + id.length, notif.row.length - 1);
      let n_d;
      if (notification_data.includes(`"object_id":comment-`)) {
        n_d = notification_data
          .replace(`"object_id":"comment-`, `"comment_id:"`)
          .replace('object_text', 'comment_text')
          .replace('root_title', 'object_title');
      } else {
        n_d = notification_data.replace('root_title', 'object_title');
      }
      await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = '${n_d}' WHERE id=${Number(id)};`);
    }));

    await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = REPLACE(notification_data, 'root_title', 'object_title');`);
  }
};
