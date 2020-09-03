'use strict';

module.exports = {
  up: (queryInterface, Datatypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('InviteLinks', 'chain_id', {
          type: Datatypes.STRING, allowNull: true,
        }, { transaction: t }),
        queryInterface.changeColumn('InviteLinks', 'community_id', { type: Datatypes.STRING, allowNull: true }, { transaction: t })
      ]);
    });
  },

  down: (queryInterface, Datatypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('InviteLinks', 'chain_id', { transaction: t }),
      ]);
    });
  }
};
