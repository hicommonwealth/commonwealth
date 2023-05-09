'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // for SET, we have
    await queryInterface.sequelize.query(`
        UPDATE "Notifications"
        SET notification_data = notification_data::jsonb - 'root_id' || -- remove the root_id entry
         jsonb_build_object('thread_id', -- build the thread_id entry
         CASE 
             WHEN notification_data::jsonb->>'root_id' like 'discussion_%' -- If it has discussion prefix
             THEN substring(notification_data::jsonb->>'root_id' from 'discussion_(.*)') -- remove the discussion prefix
             ELSE notification_data::jsonb->>'root_id' -- otherwise no discussion prefix, get thread_id portion
         END)
        WHERE notification_data::jsonb ? 'root_id'; -- only apply to jsons with root_id key
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        UPDATE "Notifications"
        SET notification_data = notification_data::jsonb - 'thread_id' ||
        jsonb_build_object('root_id', 'discussion_'::text || (notification_data::jsonb->>'thread_id')::text)
        WHERE notification_data::jsonb ? 'thread_id';
    `);
  }
};
