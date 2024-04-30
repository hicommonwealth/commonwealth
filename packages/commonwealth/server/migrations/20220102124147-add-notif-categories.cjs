'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('NotificationCategories', [
      {
        name: 'thread-edit',
        description: 'A thread is edited',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'comment-edit',
        description: 'A comment is edited',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'new-role-creation',
        description: 'A new role is created',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'entity-event',
        description: 'An entity event has occurred',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'NotificationCategories',
        {
          name: [
            'thread-edit',
            'new-role-creation',
            'comment-edit',
            'entity-event',
          ],
        },
        { transaction: t }
      );
    });
  },
};
