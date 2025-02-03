'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint('Tags', {
        fields: ['name'],
        type: 'unique',
        name: 'unique_tags_name',
        transaction,
      });

      await queryInterface.bulkInsert(
        'Tags',
        [
          {
            name: 'Clanker',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'Tags',
        { name: 'Clanker' },
        { transaction },
      );

      await queryInterface.removeConstraint('Tags', 'unique_tags_name', {
        transaction,
      });
    });
  },
};
