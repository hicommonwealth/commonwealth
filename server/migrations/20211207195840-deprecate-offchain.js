'use strict';

const community = 'harvest';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
    Steps for deprecating offchain communities
    */
    const offchainCommunitiesToKeep = [
      'clcg-commonwealth',
      'dtrade',
      'decent',
      'webb',
      'agency',
      'kabocha',
      'cmn-protocol',
      'polkaswapcommunity',
      'stargaze',
      'cabindao',
      'ion',
      'nippon-powder',
      'endaoment',
      'poof-cash',
      'pontem-network',
      'ubeswap',
      'euler-finance',
      'be-your-own-bank',
      'antimatter-dao',
      'longhorndao',
      'magicklu',
      'burnt-finance',
      'element-finance',
      'druside',
      'sentinel',
      'gopixel',
      'anmol',
      'beta-finance',
      'harvest',
      'blockhub-dao',
      'impactmarket',
      'immunefi',
      'infinity',
      'arvex28',
      '222',
      'digm-dao',
      'usemate',
      'qnt-dao',
      'knoxedge',
      'likecoin',
      'pfeilstorch',
      'redacted-cartel'
    ];

    const offchainToRemove = [
      'agoric-community',
      'bauhaus-cw',
      'blockchainyonsei',
      'bv-test',
      'cow-moon',
      'cw-kong',
      'd',
      'df344sdfg',
      'diamond-age-dao-sample',
      'dydx-internal',
      'gg',
      'governance-is-near',
      'hello-world',
      'hello-world-wow-martians-are-here',
      'hen',
      'honest-farmer',
      'impossible-finance',
      'internal',
      'meta',
      'my-community',
      'name',
      'nns',
      'o-test',
      'panacea',
      'paraswap',
      'soldev',
      'svgsvgsvgononloadconfirm1',
      'test',
      'test222',
      'testify',
      'trtr',
      'w3f-cw',
      'winky',
      'yeeeew',
      'yzs-stash',
    ]



    return queryInterface.sequelize.transaction(async (t) => {
      // Copy offchain community to Chains, with appropriate fields filled-in

      // Get rest of the info
      const chain = await queryInterface.sequelize.query(
        `SELECT id, name, icon_url, description FROM "OffchainCommunities" WHERE id='${community}'`,
        { transaction: t }
      );

      // Make sure it exists
      if (chain[0].length === 0) {
        return;
      }

      // Parse out information
      const info = chain[0][0];
      const id = info['id']
      const name = info['name']
      const icon_url = info['icon_url']
      const description = info['description'].substring(0, 200)

      console.log(id)
      console.log(name)
      console.log(icon_url)
      console.log(description)
      console.log()

      const chainObject = {
        id,
        name,
        description,
        icon_url,
        // default values below
        active: true,
        symbol: 'ETH',
        type: 'chain',
        network: 'ethereum',
        base: 'ethereum',
      }

      const chainNodeObject = {
        chain: id,
        url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr/',
        eth_chain_id: 1,
        address: null,
      }

      // Write complete rows to Chains table
      await queryInterface.bulkInsert('Chains', [chainObject], { transaction: t });
      await queryInterface.bulkInsert('ChainNodes', [chainNodeObject], { transaction: t })

      // Merge offchain ids into chain column
      await queryInterface.sequelize.query(
        `UPDATE "Roles" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "InviteCodes" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "InviteLinks" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "OffchainReactions" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "OffchainTopics" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "OffchainViewCounts" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "OffchainVotes" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "StarredCommunity" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `UPDATE "Subscriptions" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },

      );
      await queryInterface.sequelize.query(
        `UPDATE "Webhooks" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );

      // TODO: Add fkey constraints to DB


    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: community }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: community }, { transaction: t });
    });
  }
};
