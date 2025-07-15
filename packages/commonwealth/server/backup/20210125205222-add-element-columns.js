'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainCommunities',
        'element',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'element',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'chat',
        'discord',
        { transaction: t }
      );
      await queryInterface.renameColumn('Chains', 'chat', 'discord', {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainCommunities', 'element', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'element', {
        transaction: t,
      });
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'discord',
        'chat',
        { transaction: t }
      );
      await queryInterface.renameColumn('Chains', 'discord', 'chat', {
        transaction: t,
      });
    });
  },
};
