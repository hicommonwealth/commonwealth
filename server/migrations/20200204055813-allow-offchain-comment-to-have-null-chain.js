'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn('OffchainComments', 'chain', { type: DataTypes.STRING, allowNull: true });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn('OffchainComments', 'chain', { type: DataTypes.STRING, allowNull: false });
  }
};
