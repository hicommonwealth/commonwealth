'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('Threads', 'links', {
        type: Sequelize.JSONB,
        allowNull: true,
        transaction,
      });

      const [threads, metadata] = await queryInterface.sequelize.query(
        `SELECT t.id as id, t.snapshot_proposal as snapshot_proposal, sp.space as space, sp.title as title
        FROM "Threads" t
        LEFT JOIN "SnapshotProposals" sp ON t.snapshot_proposal = sp.id`
      );

      const linkedThreadsPromises = threads.map((thread) =>
        queryInterface.sequelize.query(
          `Select lt.linked_thread, t.title from "LinkedThreads" lt
          JOIN "Threads" t ON t.id=lt.linked_thread
          WHERE lt.linking_thread = ?`,
          {
            replacements: [thread.id],
            type: Sequelize.QueryTypes.SELECT,
          }
        )
      );

      const chainEntitiesPromises = threads.map((thread) =>
        queryInterface.sequelize.query(
          'SELECT * FROM "ChainEntityMeta" WHERE "thread_id" = ?',
          {
            replacements: [thread.id],
            type: Sequelize.QueryTypes.SELECT,
          }
        )
      );

      const linkedThreads = await Promise.all(linkedThreadsPromises);
      const chainEntities = await Promise.all(chainEntitiesPromises);

      const updatePromises = threads.map(async (thread, index) => {
        const links = [];
        const linkedThreadsData = linkedThreads[index];
        const chainEntitiesData = chainEntities[index];

        // Add snapshot links
        const snapshotLinks = thread.snapshot_proposal
          ? [
              {
                source: 'snapshot',
                identifier: thread.space
                  ? `${thread.space}/${thread.snapshot_proposal}`
                  : thread.snapshot_proposal,
                title: thread.title,
              },
            ]
          : [];
        links.push(...snapshotLinks);

        // Add linked thread links
        const threadLinks = linkedThreadsData.map((linkedThread) => ({
          source: 'thread',
          identifier: linkedThread.linked_thread.toString(),
          title: linkedThread.title,
        }));
        links.push(...threadLinks);

        // Add chain entity links
        const ceLinks = chainEntitiesData.map((ce) => ({
          source: 'proposal',
          identifier: ce.ce_id.toString(),
          title: ce.title,
        }));
        links.push(...ceLinks);

        // Update the "links" column
        if (links.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE "Threads" SET "links" = ? WHERE "id" = ?`,
            {
              replacements: [JSON.stringify(links), thread.id],
              type: Sequelize.QueryTypes.UPDATE,
              transaction,
            }
          );
        }
      });

      await Promise.all(updatePromises);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Threads', 'links');
  },
};
