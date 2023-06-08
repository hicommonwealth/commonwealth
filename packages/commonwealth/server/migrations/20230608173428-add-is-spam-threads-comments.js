'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Threads',
        'marked_as_spam_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'Comments',
        'marked_as_spam_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'marked_as_spam_at', {
        transaction
      });

      await queryInterface.removeColumn('Comments', 'marked_as_spam_at', {
        transaction
      });
    })
  }
};
