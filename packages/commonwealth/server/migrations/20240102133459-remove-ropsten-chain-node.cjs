'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // re-link Ropsten communities to Ethereum
      await queryInterface.sequelize.query(
        `
        with ropsten_communities as (SELECT C.id
                             FROM "Communities" C
                                      JOIN "ChainNodes" CN on C.chain_node_id = CN.id
                             WHERE CN.eth_chain_id = 3)
        UPDATE "Communities" C
        SET chain_node_id = (SELECT id FROM "ChainNodes" WHERE eth_chain_id = 1)
        FROM "ropsten_communities" rp
        WHERE rp.id = C.id;
      `,
        { transaction },
      );

      // remove linked community contracts
      await queryInterface.sequelize.query(
        `
        WITH deprecated_contracts as (
            SELECT C.id
            FROM "Contracts" C
            JOIN "ChainNodes" CN on CN.id = C.chain_node_id
            WHERE CN.eth_chain_id = 3
        ) DELETE FROM "CommunityContracts" cc
        USING deprecated_contracts dc
        WHERE cc.contract_id = dc.id;
      `,
        { transaction },
      );

      // delete Ropsten contracts
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Contracts" C
        USING "ChainNodes" CN
        WHERE C.chain_node_id = CN.id AND CN.eth_chain_id = 3;
      `,
        { transaction },
      );

      // delete memberships of groups associated to Ropsten communities
      await queryInterface.sequelize.query(
        `
        with ropsten_groups as (
            SELECT g.id
            FROM "Groups" g
            JOIN "Communities" c ON g.community_id = c.id
            JOIN "ChainNodes" cn on c.chain_node_id = cn.id
            WHERE cn.eth_chain_id = 3
        ) DELETE FROM "Memberships" m
        USING ropsten_groups rg
        WHERE rg.id = m.group_id;
      `,
        { transaction },
      );

      // delete groups associated to Ropsten communities
      await queryInterface.sequelize.query(
        `
        with ropsten_communities as (
            SELECT C.id
            FROM "Communities" C
            JOIN "ChainNodes" CN on C.chain_node_id = CN.id
            WHERE CN.eth_chain_id = 3
        ) DELETE FROM "Groups" g
            USING ropsten_communities rc
        WHERE rc.id = g.community_id;
      `,
        { transaction },
      );

      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          eth_chain_id: 3,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
