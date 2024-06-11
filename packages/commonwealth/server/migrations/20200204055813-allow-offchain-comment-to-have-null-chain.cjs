'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainComments', 'chain', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainComments', 'chain', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
