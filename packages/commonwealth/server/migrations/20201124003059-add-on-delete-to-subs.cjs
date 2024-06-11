'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const query = `ALTER TABLE "public"."Notifications"
      DROP CONSTRAINT "Notifications_subscription_id_fkey",
      ADD CONSTRAINT "Notifications_subscription_id_fkey"
        FOREIGN KEY ("subscription_id")
        REFERENCES "public"."Subscriptions"("id")
        ON DELETE CASCADE;`;
    return queryInterface.sequelize.query(query);
  },

  down: (queryInterface, Sequelize) => {
    const query = `ALTER TABLE "public"."Notifications"
      DROP CONSTRAINT "Notifications_subscription_id_fkey",
      ADD CONSTRAINT "Notifications_subscription_id_fkey"
        FOREIGN KEY ("subscription_id") 
        REFERENCES "public"."Subscriptions"("id");`;
    return queryInterface.sequelize.query(query);
  },
};
