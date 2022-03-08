'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainComments', 'parent_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'proposal',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainComments', 'parent_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'proposal',
    });
  },
};
