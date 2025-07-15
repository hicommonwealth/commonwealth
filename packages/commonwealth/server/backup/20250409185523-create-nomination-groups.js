'use strict';

const GROUP_NAME = 'Community Nominated';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // get communities with chain node and namespace
    const communities = await queryInterface.sequelize.query(
      `SELECT c.id, c.namespace_address, cn.eth_chain_id
       FROM "Communities" c
       JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
       WHERE c.namespace_address IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!communities.length) {
      console.warn(
        'No communities found with a valid namespace_address and ChainNode.',
      );
      return;
    }

    // prepare groups and bulk insert
    const groups = communities.map((community) => ({
      community_id: community.id,
      metadata: JSON.stringify({
        name: GROUP_NAME,
        description: 'Nominated users',
        groupImageUrl: '',
        required_requirements: 1,
      }),
      requirements: JSON.stringify([
        {
          rule: 'threshold',
          data: {
            threshold: '4', // must have 5 or more tokens
            source: {
              source_type: 'erc1155',
              evm_chain_id: community.eth_chain_id,
              contract_address: community.namespace_address,
              token_id: '3',
            },
          },
        },
      ]),
      is_system_managed: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('Groups', groups);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM "Groups"
       WHERE metadata->>'name' = '${GROUP_NAME}'
         AND is_system_managed = true`,
    );
  },
};
