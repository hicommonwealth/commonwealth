'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(
        'InviteCodes',
        {
          id: { type: Sequelize.STRING, primaryKey: true },
          community_id: { type: Sequelize.STRING, allowNull: false },
          creator_id: { type: Sequelize.INTEGER, allowNull: false },
          invited_email: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
          },
          used: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          underscored: true,
          paranoid: true,
          indexes: [
            { fields: ['id'], unique: true },
            { fields: ['creator_id'] },
          ],
        }
      )
      .then(() => {
        return Promise.all([
          queryInterface.addColumn(
            'OffchainCommunities',
            'isAuthenticatedForum',
            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
          ),
          queryInterface.addColumn('OffchainCommunities', 'privacyEnabled', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          }),
          queryInterface.addColumn('OffchainCommunities', 'invitesEnabled', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          }),
        ]);
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('InviteCodes').then(() => {
      return Promise.all([
        queryInterface.removeColumn(
          'OffchainCommunities',
          'isAuthenticatedForum'
        ),
        queryInterface.removeColumn('OffchainCommunities', 'privacyEnabled'),
        queryInterface.removeColumn('OffchainCommunities', 'invitesEnabled'),
      ]);
    });
  },
};
