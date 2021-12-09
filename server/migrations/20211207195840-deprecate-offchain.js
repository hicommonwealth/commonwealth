'use strict';

const communities = [
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
  'harvest',
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

module.exports = {
  up: (queryInterface, Sequelize) => {
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

    /**
     * Copy offchain community to Chains, with appropriate fields filled-in
     * @param {string} community
     * @returns null
     */
    const fromOffchainToChain = async (t, community) => {
      // Get rest of the info
      const chain = await queryInterface.sequelize.query(
        `SELECT id, name, icon_url, description FROM "OffchainCommunities" WHERE id='${community}'`,
        { transaction: t }
      );

      // Make sure it exists
      if (chain[0].length === 0) {
        console.log("community not found", community)
        return;
      }

      // Parse out information
      const info = chain[0][0];
      const id = info['id']
      const name = info['name']
      const icon_url = info['icon_url']
      const description = info['description'].substring(0, 200)
      const { website, discord, telegram } = info;


      // Create new rows
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
        website,
        discord,
        telegram
      }
      const chainNodeObject = {
        chain: id,
        url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr/',
        eth_chain_id: 1,
        address: null,
      }

      try {
        // Write complete rows to Chains table
        await queryInterface.bulkInsert('Chains', [chainObject], { transaction: t, ignoreDuplicates: true });
        await queryInterface.bulkInsert('ChainNodes', [chainNodeObject], { transaction: t, ignoreDuplicates: true })
        console.log("successfully ported over community", community)
      } catch (error) {
        console.log("error porting over community", community, error.errors)
        // console.log(error)
      }
    }

    return queryInterface.sequelize.transaction(async (t) => {

      for (let i = 0; i < communities.length; i++) {
        await fromOffchainToChain(t, communities[i])
      }

      // // Merge offchain ids into chain column
      await queryInterface.sequelize.query(
        `UPDATE "Roles" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      // await queryInterface.sequelize.query(
      //   `UPDATE "InviteCodes" SET chain_id = community_id WHERE chain_id IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "InviteLinks" SET chain_id = community_id WHERE chain_id IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainReactions" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainTopics" SET chain_id = community_id WHERE chain_id IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainViewCounts" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainVotes" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "StarredCommunity" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "Subscriptions" SET chain_id = community_id WHERE chain_id IS NULL;`,
      //   { transaction: t },

      // );
      // await queryInterface.sequelize.query(
      //   `UPDATE "Webhooks" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
      //   { transaction: t },
      // );

      // TODO: Add fkey constraints to DB


    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      for (let i = 0; i < communities.length; i++) {
        try {
          await queryInterface.bulkDelete('ChainNodes', { chain: communities[i] }, { transaction: t });
          await queryInterface.bulkDelete('Chains', { id: communities[i] }, { transaction: t });
        } catch (error) {
          console.log("error deleting community", communities[i], error)
        }
      }
    });
  }
};
