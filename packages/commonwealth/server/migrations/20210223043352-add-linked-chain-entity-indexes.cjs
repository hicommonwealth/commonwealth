'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'ChainEntities',
        { fields: ['thread_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['chain'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['community'] },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'ChainEntities',
        'chain_entities_thread_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community',
        { transaction: t }
      );
    });
  },
};
