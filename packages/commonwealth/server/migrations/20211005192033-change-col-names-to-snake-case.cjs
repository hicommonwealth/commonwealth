'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Chains',
        'blockExplorerIds',
        'block_explorer_ids',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'customDomain',
        'custom_domain',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'customStages',
        'custom_stages',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'stagesEnabled',
        'stages_enabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'isAuthenticatedForum',
        'is_authenticated_forum',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'privacyEnabled',
        'privacy_enabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'invitesEnabled',
        'invites_enabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'iconUrl',
        'icon_url',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'customDomain',
        'custom_domain',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'customStages',
        'custom_stages',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'stagesEnabled',
        'stages_enabled',
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Chains',
        'block_explorer_ids',
        'blockExplorerIds',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'custom_domain',
        'customDomain',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'custom_stages',
        'customStages',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'stages_enabled',
        'stagesEnabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'is_authenticated_forum',
        'isAuthenticatedForum',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'privacy_enabled',
        'privacyEnabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'invites_enabled',
        'invitesEnabled',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'icon_url',
        'iconUrl',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'custom_domain',
        'customDomain',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'custom_stages',
        'customStages',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'stages_enabled',
        'stagesEnabled',
        { transaction: t }
      );
    });
  },
};
