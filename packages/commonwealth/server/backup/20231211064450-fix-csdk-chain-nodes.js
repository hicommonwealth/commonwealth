'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Communities"
      SET chain_node_id = CASE
          WHEN id = 'csdk-v1' THEN (SELECT id FROM "ChainNodes" WHERE cosmos_chain_id = 'csdkv1ci')
          WHEN id = 'csdk-beta-ci' THEN (SELECT id FROM "ChainNodes" WHERE cosmos_chain_id = 'csdkbetaci')
          END
      WHERE id IN ('csdk-v1', 'csdk-beta-ci');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Communities"
      SET chain_node_id = CASE
          WHEN id = 'csdk-v1' THEN (SELECT id FROM "ChainNodes" WHERE cosmos_chain_id = 'csdkbetaci')
          WHEN id = 'csdk-beta-ci' THEN (SELECT id FROM "ChainNodes" WHERE cosmos_chain_id = 'csdkv1ci')
          END
      WHERE id IN ('csdk-v1', 'csdk-beta-ci');
    `);
  },
};
