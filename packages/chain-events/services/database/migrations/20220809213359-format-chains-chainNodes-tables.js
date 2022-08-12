'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM "Chains"
        WHERE chain_node_id IS NULL;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains"
        DROP COLUMN "name",
        DROP COLUMN symbol,
        DROP COLUMN icon_url,
        DROP COLUMN active,
        DROP COLUMN description,
        DROP COLUMN "type",
        DROP COLUMN website,
        DROP COLUMN discord,
        DROP COLUMN telegram,
        DROP COLUMN github,
        DROP COLUMN collapsed_on_homepage,
        DROP COLUMN block_explorer_ids,
        DROP COLUMN "element",
        DROP COLUMN ss58_prefix,
        DROP COLUMN custom_domain,
        DROP COLUMN custom_stages,
        DROP COLUMN stages_enabled,
        DROP COLUMN terms,
        DROP COLUMN decimals,
        DROP COLUMN bech32_prefix,
        DROP COLUMN default_summary_view,
        DROP COLUMN "snapshot",
        DROP COLUMN admin_only_polling,
        DROP COLUMN token_name;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains"
        RENAME COLUMN ce_verbose TO verbose_logging;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains"
        RENAME COLUMN has_chain_events_listener TO active;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains"
        RENAME COLUMN address TO contract_address;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
        SET url = private_url
        WHERE private_url IS NOT NULL;
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainNodes"
        DROP COLUMN eth_chain_id,
        DROP COLUMN alt_wallet_url,
        DROP COLUMN balance_type,
        DROP COLUMN "name",
        DROP COLUMN description,
        DROP COLUMN private_url;
    `, {type: 'RAW'});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ChainEndpoints");
    await queryInterface.dropTable("Listeners");
  }
};
