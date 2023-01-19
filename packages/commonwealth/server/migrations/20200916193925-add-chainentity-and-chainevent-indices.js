'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex('ChainEvents', ['entity_id'], {
        transaction: t,
      });
      await queryInterface.addIndex('ChainEntities', ['chain'], {
        transaction: t,
      });
      return queryInterface.addIndex('ChainEntities', ['chain', 'completed'], {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex('ChainEvents', ['entity_id'], {
        transaction: t,
      });
      await queryInterface.removeIndex('ChainEntities', ['chain'], {
        transaction: t,
      });
      return queryInterface.removeIndex(
        'ChainEntities',
        ['chain', 'completed'],
        { transaction: t }
      );
    });
  },
};
