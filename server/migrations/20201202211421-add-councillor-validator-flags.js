'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'Addresses',
          'is_councillor',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'Addresses',
          'is_validator',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction: t }
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Addresses', 'is_councillor', {
          transaction: t,
        }),
        queryInterface.removeColumn('Addresses', 'is_validator', {
          transaction: t,
        }),
      ]);
    });
  },
};
