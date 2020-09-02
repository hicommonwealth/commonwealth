'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('InviteCodes', 'chain_id', {
          type: DataTypes.STRING, allowNull: true,
        }, { transaction: t }),
      ]);
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('InviteCodes', 'chain_id', { transaction: t }),
      ]);
    });
  }
};
