'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('InviteCodes', {
      id: { type: DataTypes.STRING, primaryKey: true },
      community_id: { type: DataTypes.STRING, allowNull: false },
      creator_id: { type: DataTypes.INTEGER, allowNull: false },
      invited_email: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['id'], unique: true },
        { fields: ['creator_id'] },
      ],
    }).then(() => {
      return Promise.all([
        queryInterface.addColumn('OffchainCommunities', 'isAuthenticatedForum', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }),
        queryInterface.addColumn('OffchainCommunities', 'privacyEnabled', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }),
        queryInterface.addColumn('OffchainCommunities', 'invitesEnabled', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }),
      ]);
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('InviteCodes')
    .then(() => {
      return Promise.all([
        queryInterface.removeColumn('OffchainCommunities', 'isAuthenticatedForum'),
        queryInterface.removeColumn('OffchainCommunities', 'privacyEnabled'),
        queryInterface.removeColumn('OffchainCommunities', 'invitesEnabled'),
      ]);
    });
  }
};
