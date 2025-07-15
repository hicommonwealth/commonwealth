'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Users',
        'magicIssuer',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Users',
        'lastMagicLoginAt',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Addresses',
        'is_magic',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t }
      );

      // change default community chains to ethereum
      await queryInterface.bulkUpdate(
        'OffchainCommunities',
        { default_chain: 'ethereum' },
        { default_chain: 'edgeware' },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Users', 'magicIssuer', {
        transaction: t,
      });
      await queryInterface.removeColumn('Users', 'lastMagicLoginAt', {
        transaction: t,
      });
      await queryInterface.removeColumn('Addresses', 'is_magic', {
        transaction: t,
      });
      await queryInterface.bulkUpdate(
        'OffchainCommunities',
        { default_chain: 'edgeware' },
        { default_chain: 'ethereum' },
        { transaction: t }
      );
    });
  },
};
