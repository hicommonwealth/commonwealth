'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'NotificationCategories',
        [
          {
            name: 'new-reaction',
            description: 'someone reacts to a post',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'NotificationCategories',
        {
          name: 'new-reaction',
        },
        { transaction: t }
      );
    });
  },
};
