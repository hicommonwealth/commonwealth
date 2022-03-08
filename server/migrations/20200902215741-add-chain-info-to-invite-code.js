'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'InviteCodes',
          'chain_id',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.changeColumn(
          'InviteCodes',
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
        queryInterface.removeColumn('InviteCodes', 'chain_id', {
          transaction: t,
        }),
      ]);
    });
  },
};
