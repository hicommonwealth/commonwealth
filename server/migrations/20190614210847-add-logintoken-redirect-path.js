'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('LoginTokens', 'redirect_path', { type: DataTypes.STRING, allowNull: true, });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('LoginTokens', 'redirect_path');
  }
};
