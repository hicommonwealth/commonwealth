'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Chains', 'Communities', {
        transaction,
      });

      const tables = await queryInterface.showAllTables({ transaction });
      for (const table of tables) {
        const [results] = await queryInterface.sequelize.query(
          `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = '${table}'
        `,
          { transaction }
        );
        const changeColumnName = results.find(
          (column) =>
            column.column_name === 'chain' || column.column_name === 'chain_id'
        );
        if (changeColumnName) {
          console.log(table);
          await queryInterface.renameColumn(
            table,
            changeColumnName.column_name,
            'community_id',
            { transaction }
          );
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // This is the only way I know how to maintain/map the varying column names for reversion
    const prevTableColumns = {
      ChatChannels: 'chain_id',
      Bans: 'chain_id',
      Comments: 'chain',
      ChainEntityMeta: 'chain',
      CommunityContracts: 'chain_id',
      CommunitySnapshotSpaces: 'chain_id',
      CommunityBanners: 'chain_id',
      CommunityRoles: 'chain_id',
      DiscordBotConfig: 'chain_id',
      DiscussionDrafts: 'chain',
      Polls: 'chain_id',
      Reactions: 'chain',
      Topics: 'chain_id',
      Votes: 'chain_id',
      Notifications: 'chain_id',
      Threads: 'chain',
      OldChatMessages: 'chain',
      Roles: 'chain_id',
      StarredCommunities: 'chain',
      Tokens: 'chain_id',
      Subscriptions: 'chain_id',
      Webhooks: 'chain_id',
      Addresses: 'chain',
      Rules: 'chain_id',
    };
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Communities', 'Chains', {
        transaction,
      });
      for (const table of Object.keys(prevTableColumns)) {
        await queryInterface.renameColumn(
          table,
          'community_id',
          prevTableColumns[table],
          { transaction }
        );
      }
    });
  },
};
