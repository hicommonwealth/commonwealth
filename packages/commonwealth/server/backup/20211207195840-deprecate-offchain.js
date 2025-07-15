'use strict';

const offChainCommunities = [
  'webb', // edgeware
  'decent', // edgeware
  'agency', // edgeware
  'cmn-protocol', // TODO: Change to ETHEREUM (currently edgeware)
  'ion', // ethereum
  'magicklu', // edgeware
  'element-finance', // ethereum
  'phantom-dao', // ethereum
  'orakuru', // ethereum
  'polaris-dao', // edgeware
  'infinity', // ethereum
  'debt-dao', // ethereum
  'digm-dao', // ethereum
  'usemate', // ethereum
  'qnt-dao', // ethereum
  'knoxedge', // ethereum
  'pfeilstorch', // edgeware
  'new-order-dao', // ethereum
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    /**
     * Copy offchain community to Chains, with appropriate fields filled-in
     */
    const fromOffchainToChain = async (t, community) => {
      // Get rest of the info
      const chain = await queryInterface.sequelize.query(
        `SELECT * FROM "OffchainCommunities" WHERE id='${community}'`,
        { transaction: t }
      );

      // Make sure it exists
      if (chain[0].length === 0) {
        console.log('community not found', community);
        return;
      }

      // Parse out information
      const info = chain[0][0];

      // Bring over as much offchain data as possible to chain
      const {
        id,
        name,
        icon_url,
        website,
        discord,
        telegram,
        github,
        collapsed_on_homepage,
        element,
        custom_domain,
        custom_stages,
        stages_enabled,
        terms,
        default_summary_view,
      } = info;

      const default_chain = info['default_chain'].trim(); // remove trailing newline
      const description = info['description'].substring(0, 200);

      const baseQuery = await queryInterface.sequelize.query(
        `SELECT symbol, network, base, ss58_prefix FROM "Chains" WHERE id='${default_chain}'`,
        { transaction: t }
      );
      const base = baseQuery[0][0]['base'];
      const symbol = baseQuery[0][0]['symbol'];
      const network = baseQuery[0][0]['network'];
      const ss58_prefix = baseQuery[0][0]['ss58_prefix'];

      const nodeQuery = await queryInterface.sequelize.query(
        `SELECT url, eth_chain_id FROM "ChainNodes" WHERE chain='${default_chain}'`,
        { transaction: t }
      );
      const url = nodeQuery[0][0]['url'];
      const eth_chain_id = nodeQuery[0][0]['eth_chain_id'];

      // Create new rows
      const chainObject = {
        id,
        name,
        description,
        icon_url,
        active: true,
        symbol,
        type: 'offchain',
        network,
        base,
        website,
        discord,
        telegram,
        github,
        collapsed_on_homepage,
        element,
        custom_domain,
        custom_stages,
        stages_enabled,
        terms,
        default_summary_view,
        ss58_prefix,
      };
      const chainNodeObject = {
        chain: id,
        url,
        eth_chain_id,
        address: null,
      };

      try {
        // Write complete rows to Chains table
        await queryInterface.bulkInsert('Chains', [chainObject], {
          transaction: t,
          ignoreDuplicates: true,
        });
        await queryInterface.bulkInsert('ChainNodes', [chainNodeObject], {
          transaction: t,
          ignoreDuplicates: true,
        });
        console.log('successfully ported over community', community);
      } catch (error) {
        console.log('error porting over community', community, error.errors);
      }
    };

    const removeGhostRoles = async (t) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Roles" WHERE id IN 
        (
        SELECT roles.id
        FROM "Roles" roles
        LEFT JOIN "OffchainCommunities" ofc ON roles.offchain_community_id = ofc.id
        LEFT JOIN "Addresses" addr ON roles.address_id = addr.id
        WHERE addr.chain != ofc.default_chain
        )
      `,
        { transaction: t }
      );
    };

    /**
     * Remove offchain community and its dependent tables
     */
    const removeOffchain = async (t, community) => {
      console.log('removing offchain community', community);
      await queryInterface.bulkDelete(
        'OffchainReactions',
        { community },
        { transaction: t }
      );
      await queryInterface.sequelize.query(`
        DELETE FROM "Collaborations" WHERE "offchain_thread_id" in (
          SELECT "id" FROM "OffchainThreads"  WHERE "community" = '${community}'
        );
      `);
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { community },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { community },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainCommunities',
        { id: community },
        { transaction: t }
      );
    };

    /**
     * Merge offchain_community_id, community_id, etc into chain column
     * Add the not null constraint.
     */
    const mergeOffchainIdsIntoChain = async (t) => {
      console.log('merging offchain ids into chain column');

      await queryInterface.sequelize.query(
        `UPDATE "DiscussionDrafts" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "DiscussionDrafts" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "DiscussionDrafts" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainComments" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainComments" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Roles" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Roles" DROP COLUMN offchain_community_id;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Roles" ALTER COLUMN "chain_id" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "InviteCodes" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "InviteCodes" DROP COLUMN community_id;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "InviteCodes" ALTER COLUMN "chain_id" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainTopics" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainTopics" DROP COLUMN community_id;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainTopics" ALTER COLUMN "chain_id" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Subscriptions" SET chain_id = community_id WHERE chain_id IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Subscriptions" DROP COLUMN community_id;',
        { transaction: t }
      );
      // TODO: Subscriptions are currently being refactored. Add constraint another time.
      // await queryInterface.sequelize.query(
      //   `ALTER TABLE "Subscriptions" ALTER COLUMN "chain_id" SET NOT NULL;`,
      //   { transaction: t }
      // )

      await queryInterface.sequelize.query(
        `UPDATE "Webhooks" SET chain_id = offchain_community_id WHERE chain_id IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Webhooks" DROP COLUMN offchain_community_id;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Webhooks" ALTER COLUMN "chain_id" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainViewCounts" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainViewCounts" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainViewCounts" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainVotes" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainVotes" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainVotes" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "StarredCommunities" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "StarredCommunities" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "StarredCommunities" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainReactions" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainReactions" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainReactions" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "OffchainThreads" SET chain = community WHERE chain IS NULL;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" DROP COLUMN community;',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "OffchainThreads" ALTER COLUMN "chain" SET NOT NULL;`,
        { transaction: t }
      );

      // remove threads index
      console.log('removing threads index');
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
      console.log('removing comments index');
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
      // console.log("merging OffchainComments columns")
      // await queryInterface.sequelize.query(
      //   `UPDATE "OffchainComments" SET chain = community WHERE chain IS NULL;`,
      //   { transaction: t },
      // );
      // await queryInterface.sequelize.query(
      //   'ALTER TABLE "OffchainComments" DROP COLUMN community;',
      //   { transaction: t }
      // );
      // // // // //

      // add threads index
      console.log('adding threads index');
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" ADD COLUMN _search TSVECTOR',
        { transaction: t }
      );
      console.log('set _search solumn');
      await queryInterface.sequelize.query(
        `UPDATE "OffchainThreads" SET _search = to_tsvector('english', title || ' ' || plaintext);`,
        { transaction: t }
      );
      console.log('create index with gin');
      await queryInterface.sequelize.query(
        'CREATE INDEX "OffchainThreads_search" ON "OffchainThreads" USING gin(_search)',
        { transaction: t }
      );
      console.log('create trigger');
      await queryInterface.sequelize.query(
        'CREATE TRIGGER "OffchainThreads_vector_update" BEFORE INSERT OR UPDATE ON "OffchainThreads" ' +
          "FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, 'pg_catalog.english', title, plaintext)",
        { transaction: t }
      );

      // add comments index
      console.log('adding comments index');
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
        'CREATE TRIGGER "OffchainComments_vector_update" BEFORE INSERT OR UPDATE ON "OffchainComments" ' +
          "FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, 'pg_catalog.english', plaintext)",
        { transaction: t }
      );

      // remove fully remove offchain communities once ported
      await queryInterface.sequelize.query('DROP TABLE "OffchainCommunities"', {
        transaction: t,
      });

      // also remove InviteLinks:)
      await queryInterface.sequelize.query('DROP TABLE "InviteLinks"', {
        transaction: t,
      });
    };

    return queryInterface.sequelize.transaction(async (t) => {
      // Remove ghost roles
      await removeGhostRoles(t);

      // Port over offchains to chain
      for (let i = 0; i < offChainCommunities.length; i++) {
        await fromOffchainToChain(t, offChainCommunities[i]);
      }

      // Remove offchain communities
      // await queryInterface.dropTable('Collaborations', { transaction: t });
      const [offchainToRemove] = await queryInterface.sequelize.query(
        `SELECT id FROM "OffchainCommunities" WHERE id NOT IN (${[
          ...offChainCommunities.map((oc) => `'${oc}'`),
        ]})`,
        { transaction: t }
      );
      for (let i = 0; i < offchainToRemove.length; i++) {
        await removeOffchain(t, offchainToRemove[i].id);
      }

      // Merge offchain ids into chain column and delete old columns
      // Add non null constraint to chain column.
      await mergeOffchainIdsIntoChain(t);
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
  },
};
