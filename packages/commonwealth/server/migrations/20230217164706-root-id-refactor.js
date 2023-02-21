'use strict';

// The purpose of this script is to turn root_id to thread_id. To achieve this without losing any data, we must set the
// comments that pointed to a proposal, to instead point to a thread that is created to backlink to that proposal
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      const updateQueries = [];

      const threadComments = await queryInterface.sequelize.query(
        `SELECT * FROM "Comments" WHERE "root_id" ILIKE '%discussion%'`
      );

      // for each comment that is part of a discussion, replace its root_id with the thread_id
      threadComments[0].forEach((c) => {
        updateQueries.push(
          queryInterface.sequelize.query(
            `UPDATE "Comments" SET "root_id" = ${
              c.root_id.split('_')[1]
            } WHERE "id"=${c.id}`,
            { transaction: t }
          )
        );
      });

      // we will now perform the same operation with proposal comments, but in order to do so we must create threads
      // to backlink to proposals
      const proposalComments = await queryInterface.sequelize.query(
        `SELECT * FROM "Comments" WHERE "root_id" NOT ILIKE '%discussion%'`
      );

      // maps root_id -> newThread it creates
      const newThreads = new Map();
      proposalComments[0].forEach((c) => {
        if (newThreads.get(c.root_id)) {
          return; //if we already had created thread to backlink proposal comments, don't create another one
        }

        let rootParts = c.root_id.split('_');
        // handle cosmosproposals differently
        if (rootParts[0] === 'cosmosproposal') {
          rootParts = ['proposal', rootParts[1]];
        } else {
          rootParts = [`proposal/${rootParts[0]}`, rootParts[1]];
        }

        // otherwise map the root_id to a new thread to backlink proposal comments
        newThreads.set(c.root_id, {
          address_id: 1,
          title: `Thread for ${c.chain}'s ${rootParts[0]} ${rootParts[1]}`,
          kind: 'link',
          body: '',
          url: `https://commonwealth.im/${c.chain}/${rootParts[0]}/${rootParts[1]}`,
          chain: c.chain,
          read_only: true,
          stage: 'discussion',
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const inserted = await queryInterface.bulkInsert(
        'Threads',
        [...newThreads.values()],
        { returning: true, transaction: t }
      );

      // create map of rootId -> thread_id
      const rootToThreadMap = new Map(
        inserted.map((thread) => {
          const urlParts = thread.url.split('/');
          let rootId =
            urlParts[urlParts.length - 2] + '_' + urlParts[urlParts.length - 1];
          if (urlParts[urlParts.length - 2] === 'proposal') {
            rootId =
              `cosmos${urlParts[urlParts.length - 2]}` +
              '_' +
              urlParts[urlParts.length - 1];
          }
          return [rootId, thread.id];
        })
      );

      // for each proposal comment, set its root_id to thread_id
      proposalComments[0].forEach((c) => {
        // implicitly remove all councilCandidate comments to avoid fkcs
        if (
          c.root_id.includes('councilcandidate') ||
          c.root_id.includes('councilmotion')
        ) {
          updateQueries.push(
            queryInterface.sequelize.query(
              `UPDATE "Comments" SET "root_id"='1' WHERE "id"=${c.id}`,
              { transaction: t }
            )
          );
          return;
        }
        updateQueries.push(
          queryInterface.sequelize.query(
            `UPDATE "Comments" SET "root_id" = ${rootToThreadMap.get(
              c.root_id
            )} WHERE "id"=${c.id}`,
            { transaction: t }
          )
        );
      });

      await Promise.all(updateQueries);

      await queryInterface.renameColumn('Comments', 'root_id', 'thread_id', {
        transaction: t,
      });
    });

    // cant be part of the transaction, or it will cause db to deadlock
    await queryInterface.changeColumn('Comments', 'thread_id', {
      type: 'INTEGER USING CAST("thread_id" as INTEGER)',
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Comments', 'thread_id', 'root_id');
  },
};
