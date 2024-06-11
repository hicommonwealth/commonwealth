'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['yearn'] },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['fei'] },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['demo'] },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {});
  },
};
