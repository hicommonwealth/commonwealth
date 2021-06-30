'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'offchain_voting_options', {
      type: Sequelize.STRING,
      defaultValue: '{"poll": "Do you support this proposal?", "options": ["Yes", "No"]}',
      allowNull: false
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'offchain_voting_options');
  }
};
