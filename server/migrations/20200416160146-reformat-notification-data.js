/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const notifications = await queryInterface.sequelize.query(`SELECT * FROM "Notifications";`);
    await Promise.all(notifications[0].map(async (notif) => {
      const { id, notification_data } = notif;
      let data = JSON.parse(notification_data);
      if (data.thread_id) {
        data['root_id'] = data.thread_id;
        data['object_id'] = data.thread_id;
        data['root_title'] = data.thread_title;
        // console.log(data.thread_id);
        const t = await queryInterface.sequelize.query(`SELECT * FROM "OffchainThreads" WHERE id='${Number(data.thread_id)}'`);
        data['object_text'] = t[0][0] ? t[0][0].body : '';
        delete data.thread_id;
        delete data.thread_title;
      }
      if (data.comment_id) {
        // console.log(data.comment_id);
        const c = await queryInterface.sequelize.query(`SELECT * FROM "OffchainComments" WHERE id='${Number(data.comment_id)}'`);
        data['root_id'] = c[0][0] ? c[0][0].root_id.replace('discussion_', '') : '';
        data['object_id'] = data.comment_id;
        console.log(data.root_id);
        const t = await queryInterface.sequelize.query(`SELECT * FROM "OffchainThreads" WHERE id='${Number(data.root_id)}'`);
        data['object_title'] = t[0][0] ? t[0][0].title : '';
        data['object_text'] = data.comment_text;
        delete data.comment_id;
        delete data.comment_text;
      }
      if (data.object_title) {
        data['root_title'] = data.object_title;
        delete data.object_title;
      }
      data = JSON.stringify(data);
      // console.log(`UPDATE "Notifications" SET notification_data='${data}' WHERE id=${Number(id)};`);
      // await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data='${data}' WHERE id=${Number(id)};`);
    }));
  },

  down: async (queryInterface, Sequelize) => {
    // const notifications = await queryInterface.sequelize.query(`SELECT (id, notification_data) FROM "Notifications";`);
    // console.log(notifications);
    // await Promise.all(notifications[0].map(async (notif) => {
    //   const [id] = notif.row.slice(1, notif.row.length - 1).split(',');
    //   const notification_data = notif.row.slice(2 + id.length, notif.row.length - 1);
    //   let n_d;
    //   if (notification_data.includes(`"object_id":comment-`)) {
    //     n_d = notification_data
    //       .replace(`"object_id":"comment-`, `"comment_id:"`)
    //       .replace('object_text', 'comment_text')
    //       .replace('root_title', 'object_title');
    //   } else {
    //     n_d = notification_data.replace('root_title', 'object_title');
    //   }
    //   await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = '${n_d}' WHERE id=${Number(id)};`);
    // }));

    // await queryInterface.sequelize.query(`UPDATE "Notifications" SET notification_data = REPLACE(notification_data, 'root_title', 'object_title');`);
  }
};
