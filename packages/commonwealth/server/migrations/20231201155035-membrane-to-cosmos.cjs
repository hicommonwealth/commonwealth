'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Communities"
       SET network = 'osmosis', base = 'cosmos', bech32_prefix = 'osmo', chain_node_id = '20' where id = 'membrane';`,
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Communities" 
       SET network = 'ethereum', base = 'ethereum', bech32_prefix = NULL, chain_node_id = '37' where id = 'membrane';`,
    );
  },
};
