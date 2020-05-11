'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'Subscriptions',
      'immediate_email',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    await queryInterface.removeColumn(
      'Subscriptions',
      'immediate_email',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
  }
};
