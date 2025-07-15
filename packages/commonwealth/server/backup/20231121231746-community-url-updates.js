'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "Communities" (id, network, name, default_symbol, icon_url, active, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, bech32_prefix, has_chain_events_listener, default_summary_view, chain_node_id, has_homepage, created_at, updated_at, discord_bot_webhooks_enabled, directory_page_enabled)
        SELECT
          'ux', 'ux', name, default_symbol, icon_url, active, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, bech32_prefix, has_chain_events_listener, default_summary_view, chain_node_id, has_homepage, created_at, updated_at, discord_bot_webhooks_enabled, directory_page_enabled
        FROM
          "Communities"
        WHERE
          id = 'umee';

        UPDATE "Addresses" set community_id = 'ux' WHERE community_id = 'umee';
        UPDATE "Bans" set chain_id = 'ux' WHERE chain_id = 'umee';
        UPDATE "Comments" set chain = 'ux' WHERE chain = 'umee';
        UPDATE "CommunityBanners" set chain_id = 'ux' WHERE chain_id = 'umee';
        UPDATE "Topics" set chain_id = 'ux' WHERE chain_id = 'umee';
        UPDATE "Threads" set chain = 'ux' WHERE chain = 'umee';
        UPDATE "Notifications" set chain_id = 'ux' WHERE chain_id = 'umee';
        UPDATE "Polls" set community_id = 'ux' WHERE community_id = 'umee';
        UPDATE "Reactions" set chain = 'ux' WHERE chain = 'umee';
        UPDATE "StarredCommunities" set chain = 'ux' WHERE chain = 'umee';
        UPDATE "Users" set selected_chain_id = 'ux' WHERE selected_chain_id = 'umee';
        UPDATE "Votes" set community_id = 'ux' WHERE community_id = 'umee';
        UPDATE "Webhooks" set community_id = 'ux' WHERE community_id = 'umee';

        DELETE FROM "Communities" WHERE id = 'umee';

        INSERT INTO "Communities" (id, chain_node_id, name, default_symbol, icon_url, active, network, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, has_chain_events_listener, default_summary_view, has_homepage, created_at, updated_at, category, discord_bot_webhooks_enabled, directory_page_enabled)
        SELECT
          'apebond', '37', name, default_symbol, icon_url, active, network, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, has_chain_events_listener, default_summary_view, has_homepage, created_at, updated_at, category, discord_bot_webhooks_enabled, directory_page_enabled
        FROM
          "Communities"
        WHERE
          id = 'apeswap';

        UPDATE "Addresses" set community_id = 'apebond' WHERE community_id = 'apeswap';
        UPDATE "Bans" set chain_id = 'apebond' WHERE chain_id = 'apeswap';
        UPDATE "Comments" set chain = 'apebond' WHERE chain = 'apeswap';
        UPDATE "CommunityBanners" set chain_id = 'apebond' WHERE chain_id = 'apeswap';
        UPDATE "CommunityContracts" set chain_id = 'apebond' WHERE chain_id = 'apeswap';
        UPDATE "CommunitySnapshotSpaces" set community_id = 'apebond' WHERE community_id = 'apeswap';
        UPDATE "Topics" set chain_id = 'apebond' WHERE chain_id = 'apeswap';
        UPDATE "Threads" set chain = 'apebond' WHERE chain = 'apeswap';
        UPDATE "Notifications" set chain_id = 'apebond' WHERE chain_id = 'apeswap';
        UPDATE "Polls" set community_id = 'apebond' WHERE community_id = 'apeswap';
        UPDATE "Reactions" set chain = 'apebond' WHERE chain = 'apeswap';
        UPDATE "StarredCommunities" set chain = 'apebond' WHERE chain = 'apeswap';
        UPDATE "Users" set selected_chain_id = 'apebond' WHERE selected_chain_id = 'apeswap';
        UPDATE "Votes" set community_id = 'apebond' WHERE community_id = 'apeswap';
        UPDATE "Webhooks" set community_id = 'apebond' WHERE community_id = 'apeswap';
        
        DELETE FROM "Communities" WHERE id = 'apeswap';
        `,
        { raw: true, transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "Communities" (id, network, name, default_symbol, icon_url, active, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, bech32_prefix, has_chain_events_listener, default_summary_view, chain_node_id, has_homepage, created_at, updated_at, discord_bot_webhooks_enabled, directory_page_enabled)
        SELECT
          'umee', 'umee', name, default_symbol, icon_url, active, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, bech32_prefix, has_chain_events_listener, default_summary_view, chain_node_id, has_homepage, created_at, updated_at, discord_bot_webhooks_enabled, directory_page_enabled
        FROM
          "Communities"
        WHERE
          id = 'ux';
        
        UPDATE "Addresses" set community_id = 'umee' WHERE community_id = 'ux';
        UPDATE "Bans" set chain_id = 'umee' WHERE chain_id = 'ux';
        UPDATE "Comments" set chain = 'umee' WHERE chain = 'ux';
        UPDATE "CommunityBanners" set chain_id = 'umee' WHERE chain_id = 'ux';
        UPDATE "Topics" set chain_id = 'umee' WHERE chain_id = 'ux';
        UPDATE "Threads" set chain = 'umee' WHERE chain = 'ux';
        UPDATE "Notifications" set chain_id = 'umee' WHERE chain_id = 'ux';
        UPDATE "Polls" set community_id = 'umee' WHERE community_id = 'ux';
        UPDATE "Reactions" set chain = 'umee' WHERE chain = 'ux';
        UPDATE "StarredCommunities" set chain = 'umee' WHERE chain = 'ux';
        UPDATE "Users" set selected_chain_id = 'umee' WHERE selected_chain_id = 'ux';
        UPDATE "Votes" set community_id = 'umee' WHERE community_id = 'ux';
        UPDATE "Webhooks" set community_id = 'umee' WHERE community_id = 'ux';

        DELETE FROM "Communities" WHERE id = 'ux';

        INSERT INTO "Communities" (id, chain_node_id, name, default_symbol, icon_url, active, network, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, has_chain_events_listener, default_summary_view, has_homepage, created_at, updated_at, category, discord_bot_webhooks_enabled, directory_page_enabled)
        SELECT
          'apeswap', '38', name, default_symbol, icon_url, active, network, description, type, website, discord, telegram, github, collapsed_on_homepage, base, custom_domain, custom_stages, stages_enabled, terms, has_chain_events_listener, default_summary_view, has_homepage, created_at, updated_at, category, discord_bot_webhooks_enabled, directory_page_enabled
        FROM
          "Communities"
        WHERE
          id = 'apebond';
          
        UPDATE "Addresses" set community_id = 'apeswap' WHERE community_id = 'apebond';
        UPDATE "Bans" set chain_id = 'apeswap' WHERE chain_id = 'apebond';
        UPDATE "Comments" set chain = 'apeswap' WHERE chain = 'apebond';
        UPDATE "CommunityBanners" set chain_id = 'apeswap' WHERE chain_id = 'apebond';
        UPDATE "CommunityContracts" set chain_id = 'apeswap' WHERE chain_id = 'apebond';
        UPDATE "CommunitySnapshotSpaces" set community_id = 'apeswap' WHERE community_id = 'apebond';
        UPDATE "Topics" set chain_id = 'apeswap' WHERE chain_id = 'apebond';
        UPDATE "Threads" set chain = 'apeswap' WHERE chain = 'apebond';
        UPDATE "Notifications" set chain_id = 'apeswap' WHERE chain_id = 'apebond';
        UPDATE "Polls" set community_id = 'apeswap' WHERE community_id = 'apebond';
        UPDATE "Reactions" set chain = 'apeswap' WHERE chain = 'apebond';
        UPDATE "StarredCommunities" set chain = 'apeswap' WHERE chain = 'apebond';
        UPDATE "Users" set selected_chain_id = 'apeswap' WHERE selected_chain_id = 'apebond';
        UPDATE "Votes" set community_id = 'apeswap' WHERE community_id = 'apebond';
        UPDATE "Webhooks" set community_id = 'apeswap' WHERE community_id = 'apebond';
        
        DELETE FROM "Communities" WHERE id = 'apebond';
        `,
        { raw: true, transaction },
      );
    });
  },
};
