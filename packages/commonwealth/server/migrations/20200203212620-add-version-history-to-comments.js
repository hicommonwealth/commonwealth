'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainComments', 'version_history', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: [],
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainComments', 'version_history', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: [],
    });
  },
};
