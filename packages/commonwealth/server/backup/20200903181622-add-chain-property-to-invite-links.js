'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'InviteLinks',
          'chain_id',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.changeColumn(
          'InviteLinks',
          'community_id',
          { type: Sequelize.STRING, allowNull: true },
          { transaction: t }
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('InviteLinks', 'chain_id', {
          transaction: t,
        }),
      ]);
    });
  },
};
