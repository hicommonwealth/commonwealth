'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // delete notifications attached to deleted subscriptions
      await queryInterface.sequelize.query(
        'DELETE FROM "Notifications" WHERE id in (SELECT "Notifications".id FROM "Notifications" JOIN "Subscriptions" ON "Notifications".subscription_id="Subscriptions".id WHERE "Subscriptions".deleted_at IS NOT NULL);',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM "Subscriptions" WHERE deleted_at IS NOT NULL',
        { transaction: t }
      );
      return queryInterface.removeColumn('Subscriptions', 'deleted_at', {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Subscriptions', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
