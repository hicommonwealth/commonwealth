'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'OffchainThreads',
      'offchain_voting_options',
      {
        type: Sequelize.STRING,
        defaultValue:
          '{"name": "Do you support this proposal?", "choices": ["Yes", "No"]}',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'OffchainThreads',
      'offchain_voting_options'
    );
  },
};
