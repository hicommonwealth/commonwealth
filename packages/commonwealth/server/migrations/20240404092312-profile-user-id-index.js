'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(
        'Profiles',
        { fields: ['user_id'] },
        {
          transaction,
        },
      );
      await queryInterface.addIndex(
        'Reactions',
        { fields: ['thread_id'] },
        {
          transaction,
        },
      );
      // there are already 3 multi-column indexes where the first column
      // is community_id -> this index is redundant
      await queryInterface.removeIndex('Threads', 'threads_community_id', {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('Profiles', 'profiles_user_id', {
        transaction,
      });
      await queryInterface.removeIndex('Reactions', 'reactions_thread_id', {
        transaction,
      });
      await queryInterface.addIndex(
        'Threads',
        { fields: ['community_id'] },
        {
          transaction,
        },
      );
    });
  },
};
