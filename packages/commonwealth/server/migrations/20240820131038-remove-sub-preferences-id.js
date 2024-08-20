'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "SubscriptionPreferences"
        ADD CONSTRAINT "SubscriptionPreferences_user_id_pk" PRIMARY KEY USING INDEX subscription_preferences_user_id;
      `,
        { transaction },
      );
      await queryInterface.removeColumn('SubscriptionPreferences', 'id', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {},
};
