'use strict';

const offChainCommunities = [
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

module.exports = {
  up: (queryInterface, Sequelize) => {
    /**
     * Copy offchain community to Chains, with appropriate fields filled-in
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

      // console.log(chain, website, discord, telegram)

      // Create new rows
      const chainObject = {
        id,
        name,
        description,
        icon_url,
        // default values below
        active: true,
        symbol: 'ETH',
        type: 'offchain',
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
      }
    }

    /**
     * Remove offchain community and its dependent tables
     */
    const removeOffchain = async (t, community) => {
      console.log("removing offchain community", community)
      await queryInterface.bulkDelete('OffchainReactions', { community }, { transaction: t })
      await queryInterface.sequelize.query(`
        DELETE FROM "Collaborations" WHERE "offchain_thread_id" in (
          SELECT "id" FROM "OffchainThreads"  WHERE "community" = '${community}'
        );
      `)
      await queryInterface.bulkDelete('OffchainThreads', { community }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { community }, { transaction: t });
      await queryInterface.bulkDelete('OffchainCommunities', { id: community }, { transaction: t })
    }

    /**
     * Merge offchain_community_id, community_id, etc into chain column
     */
    const mergeOffchainIdsIntoChain = async (t,) => {
      console.log("merging offchain ids into chain column")

      await queryInterface.sequelize.query(
        `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      // await queryInterface.sequelize.query(
      //   'ALTER TABLE "OffchainComments" DROP COLUMN community;',
      //   { transaction: t }
      // );

      await queryInterface.sequelize.query(
        `UPDATE "Roles" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Roles" DROP COLUMN offchain_community_id;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "InviteCodes" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "InviteCodes" DROP COLUMN community_id;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "InviteLinks" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "InviteLinks" DROP COLUMN community_id;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainTopics" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainTopics" DROP COLUMN community_id;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Subscriptions" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Subscriptions" DROP COLUMN community_id;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Webhooks" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Webhooks" DROP COLUMN offchain_community_id;',
        { transaction: t }
      );


      await queryInterface.sequelize.query(
        `UPDATE "OffchainViewCounts" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainViewCounts" DROP COLUMN community;',
        { transaction: t }
      );


      await queryInterface.sequelize.query(
        `UPDATE "OffchainVotes" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainVotes" DROP COLUMN community;',
        { transaction: t }
      );


      await queryInterface.sequelize.query(
        `UPDATE "StarredCommunities" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "StarredCommunities" DROP COLUMN community;',
        { transaction: t }
      );


      await queryInterface.sequelize.query(
        `UPDATE "OffchainReactions" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainReactions" DROP COLUMN community;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainThreads" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" DROP COLUMN community;',
        { transaction: t }
      );



      // remove threads index
      console.log("removing threads index")
      await queryInterface.sequelize.query(
        'DROP TRIGGER "OffchainThreads_vector_update" ON "OffchainThreads";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP INDEX "OffchainThreads_search";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" DROP COLUMN _search;',
        { transaction: t }
      );

      // remove comments index
      console.log("removing comments index")
      await queryInterface.sequelize.query(
        'DROP TRIGGER "OffchainComments_vector_update" ON "OffchainComments";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP INDEX "OffchainComments_search";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainComments" DROP COLUMN _search;',
        { transaction: t }
      );

      // // // // //
      console.log("merging OffchainComments columns")
      await queryInterface.sequelize.query(
        `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
        { transaction: t },
      );
      // // // // //

      // add threads index
      console.log("adding threads index")
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" ADD COLUMN _search TSVECTOR',
        { transaction: t }
      );
      console.log("set _search solumn")
      await queryInterface.sequelize.query(
        `UPDATE "OffchainThreads" SET _search = to_tsvector('english', title || ' ' || plaintext);`,
        { transaction: t }
      );
      console.log("create index with gin")
      await queryInterface.sequelize.query(
        'CREATE INDEX "OffchainThreads_search" ON "OffchainThreads" USING gin(_search)',
        { transaction: t }
      );
      console.log("create trigger")
      await queryInterface.sequelize.query(
        'CREATE TRIGGER "OffchainThreads_vector_update" BEFORE INSERT OR UPDATE ON "OffchainThreads" '
        + 'FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, \'pg_catalog.english\', title, plaintext)',
        { transaction: t }
      );

      // add comments index
      console.log("adding comments index")
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainComments" ADD COLUMN _search TSVECTOR',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'UPDATE "OffchainComments" SET _search = to_tsvector(\'english\', plaintext)',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE INDEX "OffchainComments_search" ON "OffchainComments" USING gin(_search)',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE TRIGGER "OffchainComments_vector_update" BEFORE INSERT OR UPDATE ON "OffchainComments" '
        + 'FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, \'pg_catalog.english\', plaintext)',
        { transaction: t }
      );
    }

    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Port over offchains to chain
        for (let i = 0; i < offChainCommunities.length; i++) {
          await fromOffchainToChain(t, offChainCommunities[i])
        }

        // Remove offchain communities
        // await queryInterface.dropTable('Collaborations', { transaction: t });
        for (let i = 0; i < offchainToRemove.length; i++) {
          await removeOffchain(t, offchainToRemove[i]);
        }

        // Merge offchain ids into chain column and delete old columns
        await mergeOffchainIdsIntoChain(t)

      } catch (error) {
        console.log(error)
      }
    });

  },
  down: (queryInterface, Sequelize) => {
    // There isnt really a good down. To delete the ported over community means to delete all their comments
    // and other related data.
    return queryInterface.sequelize.transaction(async (t) => {
      // for (let i = 0; i < offChainCommunities.length; i++) {
      //   try {
      //     await queryInterface.bulkDelete('OffchainReactions', { community: offChainCommunities[i] }, { transaction: t })
      //     await queryInterface.bulkDelete('OffchainThreads', { community: offChainCommunities[i] }, { transaction: t });
      //     await queryInterface.bulkDelete('OffchainComments', { community: offChainCommunities[i] }, { transaction: t });
      //     await queryInterface.bulkDelete('OffchainCommunities', { id: offChainCommunities[i] }, { transaction: t })
      //     await queryInterface.bulkDelete('ChainNodes', { chain: offChainCommunities[i] }, { transaction: t });
      //     await queryInterface.bulkDelete('Chains', { id: offChainCommunities[i] }, { transaction: t });
      //   } catch (error) {
      //     console.log("error deleting community", offChainCommunities[i], error)
      //   }
      // }
    });
  }
};
