'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove offchain prefixes from all database tables

    return queryInterface.sequelize.transaction(async (transaction) => {
      // Zak
      // TODO
      await queryInterface.renameTable("OffchainReactions", "Reactions", { transaction });

      // Jake
      await queryInterface.renameTable('OffchainViewCounts', 'ViewCounts', { transaction });
      await queryInterface.renameTable('OffchainTopics', 'Topics', { transaction });
      // TODO
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add offchain prefixes

    return queryInterface.sequelize.transaction(async (transaction) => {
      // Zak
      // TODO
      await queryInterface.renameTable("Reactions", "OffchainReactions", { transaction });

      // Jake
      await queryInterface.renameTable('ViewCounts', 'OffchainViewCounts', { transaction });
      await queryInterface.renameTable('Topics', 'OffchainTopics', { transaction });
      // TODO
    });
  }
};
