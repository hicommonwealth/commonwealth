'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'ChainEntities',
          'title',
          {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'ChainEntities',
          'address_id',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Addresses',
              key: 'id'
            },
          },
          { transaction: t }
        )
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn(
          'ChainEntities',
          'title',
          {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.removeColumn(
          'ChainEntities',
          'address)id',
          {
            type: Sequelize.STRING,
            allowNull: true,
            references: {
              model: 'Addresses',
              key: 'id'
            },
          },
          { transaction: t }
        )
      ]);
    });
  }
};
