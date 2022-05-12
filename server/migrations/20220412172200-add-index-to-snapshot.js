'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('NotificationCategories', [{
        name: 'new-snapshot',
        description: 'snapshot POST recieved',
        created_at: new Date(),
        updated_at: new Date(),
      }], { transaction: t });

      await queryInterface.addIndex('Chains', ['snapshot'],
      { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('NotificationCategories', {
        name: 'new-snapshot',
      }, { transaction: t });

      await queryInterface.removeIndex('Chains', ['snapshot'],
      { transaction: t });
    });
  }
};
