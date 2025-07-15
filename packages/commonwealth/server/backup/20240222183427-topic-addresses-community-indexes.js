'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex('Topics', ['community_id'], {
        name: 'topics_community_id_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Addresses', ['community_id'], {
        name: 'addresses_community_id_idx',
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'Addresses',
        'addresses_community_id_idx',
        { transaction: t },
      );
      await queryInterface.removeIndex('Topics', 'topics_community_id_idx', {
        transaction: t,
      });
    });
  },
};
