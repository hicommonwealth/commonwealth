/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // add columns
      await queryInterface.addColumn(
        'Subscriptions',
        'chain_id',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'community_id',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'offchain_thread_id',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'offchain_comment_id',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'chain_event_type_id',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'chain_entity_id',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );

      // for each subscription, create relevant associations
      const chains = await queryInterface.sequelize.query(
        `SELECT * FROM "Chains"`,
        { transaction: t }
      );
      const chainIds = chains[0].map((c) => c.id);
      const subscriptions = await queryInterface.sequelize.query(
        `SELECT * FROM "Subscriptions";`,
        { transaction: t }
      );
      await Promise.all(
        subscriptions[0].map(async (s) => {
          const { object_id, category_id, id } = s;
          const object_id_split = object_id.split(/-|_/); // hyphen or underscore
          const p_object_id = object_id_split[1];
          const entity = object_id_split[0];
          let query;
          switch (category_id) {
            case 'new-thread-creation': // object_id: "kusama"/"edgeware"
              if (chainIds.includes(object_id)) {
                query = `UPDATE "Subscriptions" SET chain_id='${object_id}' WHERE id=${id}`;
              } else {
                query = `UPDATE "Subscriptions" SET community_id='${object_id}' WHERE id=${id}`;
              }
              await queryInterface.sequelize.query(query, { transaction: t });
              break;
            case 'new-comment-creation': // object_id: "discussion_123"
              // councilmotion_0x3dd9c8b50b896089ddf9db75d231bd23d6596822ba6d5480697ed0833b64f077
              // referendum_0
              if (entity === 'discussion') {
                // associate OffchainThread
                query = `UPDATE "Subscriptions" SET offchain_thread_id=${Number(
                  p_object_id
                )} WHERE id=${id};`;
                // await queryInterface.sequelize.query(query);
                // associate chain or community
                const thread = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainThreads" WHERE id=${Number(
                    p_object_id
                  )};`,
                  { transaction: t }
                );
                if (thread[0].length === 0) break;
                if (thread[0][0].chain) {
                  query += `UPDATE "Subscriptions" SET chain_id='${thread[0][0].chain}' WHERE id=${id};`;
                } else if (thread[0][0].community) {
                  query += `UPDATE "Subscriptions" SET community_id='${thread[0][0].community}' WHERE id=${id};`;
                }
                await queryInterface.sequelize.query(query, { transaction: t });
              } else if (entity === 'comment') {
                // query associate OffchainComment
                query = `UPDATE "Subscriptions" SET offchain_comment_id=${Number(
                  p_object_id
                )} WHERE id=${id};`;
                // // associate chain or community
                const comment = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainComments" WHERE id=${Number(
                    p_object_id
                  )};`,
                  { transaction: t }
                );
                if (comment[0].length === 0) break;
                if (comment[0][0].chain) {
                  query += `UPDATE "Subscriptions" SET chain_id='${comment[0][0].chain}' WHERE id=${id};`;
                } else if (comment[0][0].community) {
                  query += `UPDATE "Subscriptions" SET community_id='${comment[0][0].community}' WHERE id=${id};`;
                }
                await queryInterface.sequelize.query(query, { transaction: t });
              } else {
                // associate ChainEntity
                // associate chain
                // TODO: I THINK THIS IS NOT POSSIBLE GIVEN CURRENT ISSUE IN FINDING CHAIN FROM SUBSCRIPTION
              }
              break;
            case 'new-reaction': // object_id "comment-923" / "discussion_442" (hyphen or underscore)
              if (entity === 'discussion') {
                // associate offchain_thread
                query = `UPDATE "Subscriptions" SET offchain_thread_id=${Number(
                  p_object_id
                )} WHERE id=${id};`;
                // associate chain or community
                const thread = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainThreads" WHERE id=${Number(
                    p_object_id
                  )};`,
                  { transaction: t }
                );
                if (thread[0].length === 0) break;
                if (thread[0][0].chain) {
                  query += `UPDATE "Subscriptions" SET chain_id='${thread[0][0].chain}' WHERE id=${id};`;
                } else if (thread[0][0].community) {
                  query += `UPDATE "Subscriptions" SET community_id='${thread[0][0].community}' WHERE id=${id};`;
                }
                await queryInterface.sequelize.query(query, { transaction: t });
              } else if (entity === 'comment') {
                // associate offchain_comment
                query = `UPDATE "Subscriptions" SET offchain_comment_id=${Number(
                  p_object_id
                )} WHERE id=${id};`;
                // associate chain or community
                const comment = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainComments" WHERE id=${Number(
                    p_object_id
                  )};`,
                  { transaction: t }
                );
                if (comment[0].length === 0) break;
                if (comment[0][0].chain) {
                  query += `UPDATE "Subscriptions" SET chain_id='${comment[0][0].chain}' WHERE id=${id};`;
                } else if (comment[0][0].community) {
                  query += `UPDATE "Subscriptions" SET community_id='${comment[0][0].community}' WHERE id=${id};`;
                }
                await queryInterface.sequelize.query(query, { transaction: t });
              } else {
                // There are no new-reaction subscriptions for chain entities in our db
              }
              break;
            case 'chain-event': // object_id: "edgeware-reward" / "edgeware-treasury-awarded" / "edgeware-treasury-rejected"
              query = `UPDATE "Subscriptions" SET chain_id='${entity}' WHERE id=${id};`;
              query += `UPDATE "Subscriptions" SET chain_event_type_id='${object_id}' WHERE id=${id};`;
              await queryInterface.sequelize.query(query, { transaction: t });
              break;
            default:
              // all cases should be detailed above.
              break;
          }
        })
      ); // end of loop
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([
        queryInterface.removeColumn('Subscriptions', 'chain_id', {
          transaction: t,
        }),
        queryInterface.removeColumn('Subscriptions', 'community_id', {
          transaction: t,
        }),
        queryInterface.removeColumn('Subscriptions', 'offchain_thread_id', {
          transaction: t,
        }),
        queryInterface.removeColumn('Subscriptions', 'offchain_comment_id', {
          transaction: t,
        }),
        queryInterface.removeColumn('Subscriptions', 'chain_event_type_id', {
          transaction: t,
        }),
        queryInterface.removeColumn('Subscriptions', 'chain_entity_id', {
          transaction: t,
        }),
      ]);
    });
  },
};
