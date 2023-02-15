'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'ChainEntities',
          'title',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'ChainEntities',
          'author',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('ChainEntities', 'title', {
          transaction: t,
        }),
        queryInterface.removeColumn('ChainEntities', 'author', {
          transaction: t,
        }),
      ]);
    });
  },
};
