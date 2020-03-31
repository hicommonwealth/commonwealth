'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('Users', 'disableRichText', { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('Users', 'disableRichText');
  }
};
