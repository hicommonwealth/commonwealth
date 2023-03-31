'use strict';

// The purpose of this script is to turn root_id to thread_id. To achieve this without losing any data, we must set the
// comments that pointed to a proposal, to instead point to a thread that is created to backlink to that proposal

function tupleToKey(list) {
  return list[0] + '+' + list[1];
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.addColumn('Threads', 'view_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        transaction: t
      });

      const updateQueries = [];
      const deleteCommentIds = [];

      const threadComments = await queryInterface.sequelize.query(
        `SELECT * FROM "Comments" WHERE "root_id" ILIKE '%discussion%'`,
        { transaction: t }
      );
      if (threadComments[0].length > 0) {
        // for each comment that is part of a discussion, replace its root_id with the thread_id
        threadComments[0].forEach((c) => {
          updateQueries.push(
            queryInterface.sequelize.query(
              `UPDATE "Comments" SET "root_id" = ${
              c.root_id.split('_')[1]
            } WHERE "id"=${c.id}`,
              {transaction: t}
            )
          );
        });

        // we will now perform the same operation with proposal comments, but in order to do so we must create threads
        // to backlink to proposals
        const proposalComments = await queryInterface.sequelize.query(
          `SELECT * FROM "Comments" WHERE "root_id" NOT ILIKE '%discussion%'`,
          { transaction: t }
        );

        if (proposalComments[0].length > 0) {
          // maps [chain, root_id] -> newThread it creates
          const newThreads = new Map();
          const urlToRootId = new Map();
          proposalComments[0].forEach((c) => {
            if (newThreads.get(tupleToKey([c.chain, c.root_id]))) {
              return; // if we already had created thread to backlink proposal comments, don't create another one
            }

            let rootParts = c.root_id.split('_');
            let key = tupleToKey([c.chain, c.root_id]);
            // handle cosmosproposals and onchainproposal differently
            if (
              rootParts[0] === 'cosmosproposal' ||
              rootParts[0] === 'onchainproposal'
            ) {
              rootParts = ['proposal', rootParts[1]];
              key = tupleToKey([c.chain, rootParts.join('_')]);
            } else {
              rootParts = [`proposal/${rootParts[0]}`, rootParts[1]];
            }

            const url = `https://commonwealth.im/${c.chain}/${rootParts[0]}/${rootParts[1]}`;
            // otherwise map the root_id to a new thread to backlink proposal comments
            newThreads.set(key, {
              address_id: 1,
              title: `Thread for ${c.chain}'s ${rootParts[0]} ${rootParts[1]}`,
              kind: 'link',
              body: '',
              url: url,
              chain: c.chain,
              read_only: true,
              stage: 'discussion',
              canvas_action: null,
              canvas_hash: null,
              canvas_session: null,
              // set the dates to a year back so they dont spam chain's home page
              created_at: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1)
              ),
              updated_at: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1)
              ),
            });

            urlToRootId.set(url, c.root_id);
          });

          const inserted = await queryInterface.bulkInsert(
            'Threads',
            [...newThreads.values()],
            {returning: true, transaction: t}
          );

          // create map of rootId -> thread_id
          const rootToThreadMap = new Map(
            inserted.map((thread) => {
              return [
                tupleToKey([thread.chain, urlToRootId.get(thread.url)]),
                thread.id,
              ];
            })
          );

          // for each proposal comment, set its root_id to thread_id
          proposalComments[0].forEach((c) => {
            if (
              c.root_id.includes('councilcandidate') ||
              c.root_id.includes('councilmotion')
            ) {
              deleteCommentIds.push(c.id);
              return;
            }
            updateQueries.push(
              queryInterface.sequelize.query(
                `UPDATE "Comments" SET "root_id" = ${rootToThreadMap.get(
              tupleToKey([c.chain, c.root_id])
            )} WHERE "id"=${c.id}`,
                {transaction: t}
              )
            );
          });

          const deleteQueries = [];
          deleteCommentIds.forEach((id) => {
            deleteQueries.push(
              queryInterface.bulkDelete(
                'Reactions',
                {comment_id: id},
                {transaction: t}
              )
            );
          });

          deleteCommentIds.forEach((id) => {
            deleteQueries.push(
              queryInterface.bulkDelete('Comments', {id: id}, {transaction: t})
            );
          });

          await Promise.all([...deleteQueries, ...updateQueries]);

        }
      }

      await queryInterface.renameColumn('Comments', 'root_id', 'thread_id', {
        transaction: t,
      });

      const viewCounts = await queryInterface.sequelize.query(
        `SELECT * FROM "ViewCounts"`,
        { transaction: t }
      );

      if (viewCounts[0].length > 0) {
        const viewCountMap = new Map(viewCounts[0].map((v) => [v.object_id.split('_')[1], v]));

        const threads = await queryInterface.sequelize.query(
          `SELECT id FROM "Threads"`,
          { transaction: t }
        );

        const viewCountUpdates = [];
        threads[0].forEach((thread) => {
          if (viewCountMap.has(thread.id.toString())) {
            viewCountUpdates.push(
              queryInterface.sequelize.query(
                `UPDATE "Threads"
               SET "view_count" = ${
                viewCountMap.get(thread.id.toString()).view_count
              }
               WHERE "id" = ${thread.id}`,
                {transaction: t}
              )
            );
          }
        });

        await Promise.all(viewCountUpdates);
      }

      await queryInterface.dropTable('ViewCounts', {
        transaction: t
      });
    });

    // simulate failure

    throw new Error('simulated failure');

    // cant be part of the transaction, or it will cause db to deadlock
    // eslint-disable-next-line no-unreachable
    await queryInterface.changeColumn('Comments', 'thread_id', {
      type: 'INTEGER USING CAST("thread_id" as INTEGER)',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // IRREVERSABLE data loss (loses proposal comments), but schema will update fine.
    await queryInterface.changeColumn('Comments', 'thread_id', {
      type: 'varchar',
      allowNull: false
    });

    await queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.renameColumn('Comments', 'thread_id', 'root_id', {transaction: t});

      await queryInterface.sequelize.query(
        `UPDATE "Comments" SET "root_id" = 
         regexp_replace(root_id, '(.*)', 'discussion_\\1')`,
        {transaction: t}
      );

      await queryInterface.createTable(
        'ViewCounts',
        {
          id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
          chain: {type: Sequelize.STRING},
          object_id: {type: Sequelize.STRING, allowNull: false},
          view_count: {type: Sequelize.INTEGER, allowNull: false},
        },
        {
          underscored: true,
          timestamps: false,
          indexes: [
            {fields: ['id']},
            {fields: ['chain', 'object_id']},
            {fields: ['community', 'object_id']},
            {fields: ['chain', 'community', 'object_id']},
            {fields: ['view_count']},
          ],
        },
        {transaction: t}
      );

      const threads = await queryInterface.sequelize.query(
        `SELECT id, chain, view_count FROM "Threads"`,
        { transaction: t }
      );

      const updateQueries = [];
      threads[0].forEach((th) => {
        updateQueries.push(
          queryInterface.sequelize.query(
            `INSERT INTO "ViewCounts" (chain, object_id, view_count)
         VALUES ('${th.chain}', 'discussion_${th.id}', ${th.view_count})`,
            {transaction: t}
          )
        );
      });

      await Promise.all(updateQueries);

      return queryInterface.removeColumn('Threads', 'view_count', {transaction: t});
    });
  },
};
