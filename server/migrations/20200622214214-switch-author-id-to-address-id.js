'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('OffchainThreads', 'author_id', 'address_id');
    await queryInterface.renameColumn('DiscussionDrafts', 'author_id', 'address_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('OffchainThreads', 'address_id', 'author_id');
    await queryInterface.renameColumn('DiscussionDrafts', 'address_id', 'author_id');
  }
};
