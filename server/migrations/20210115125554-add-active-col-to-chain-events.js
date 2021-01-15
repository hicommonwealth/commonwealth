'use strict';


module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('ChainEvents', 'active', {
        type: DataTypes.BOOLEAN, defaultValue: true,
      }, { transaction: t });
    });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainEvents', 'active', { transaction: t });
    })
  }
};
