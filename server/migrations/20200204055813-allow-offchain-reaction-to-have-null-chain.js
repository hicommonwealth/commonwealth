'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn('OffchainReactions', 'chain', { type: DataTypes.STRING, allowNull: true });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn('OffchainReactions', 'chain', { type: DataTypes.STRING, allowNull: false });
  }
};
