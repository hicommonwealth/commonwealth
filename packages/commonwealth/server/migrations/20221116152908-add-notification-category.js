'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('NotificationCategories', [{
        name: 'snapshot-proposal',
        description: 'Snapshot proposal notifications',
        created_at: new Date(),
        updated_at: new Date(),
      }], { transaction: t });
  });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('NotificationCategories', {
        name: 'snapshot-proposal',
      }, { transaction: t });
    });
  }
};
