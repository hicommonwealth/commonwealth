'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.addColumn(
      'Threads',
      'links',
      {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      { transaction }
    );

    // Get Threads
    const [threads, metadata] = await queryInterface.sequelize.query(
      'SELECT id, snapshot_proposal FROM "Threads"',
      { transaction }
    );
    const updatePromises = [];

    for (const thread of threads) {
      // Add snapshot links
      const links = thread.snapshot_proposal
        ? [{ source: 'snapshot', identifier: thread.snapshot_proposal }]
        : [];

      // Add linked threads
      const linkedThreads = await queryInterface.sequelize.query(
        'SELECT * FROM "LinkedThreads" WHERE "linking_thread" = ?',
        {
          replacements: [thread.id],
          transaction,
        }
      );

      if (linkedThreads[0].length > 0) {
        const threadLinks = linkedThreads[0].map((linkedThread) => ({
          source: 'thread',
          identifier: linkedThread.linked_thread.toString(),
        }));
        links.push(...threadLinks);
      }

      // Add chain entities
      const chainEntities = await queryInterface.sequelize.query(
        'SELECT * FROM "ChainEntityMeta" WHERE "thread_id" = ?',
        {
          replacements: [thread.id],
          transaction,
        }
      );

      if (chainEntities[0].length > 0) {
        const ceLinks = chainEntities[0].map((ce) => ({
          source: 'proposal',
          identifier: ce.ce_id.toString(),
        }));
        links.push(...ceLinks);
      }

      if (links.length > 0) {
        updatePromises.push(
          queryInterface.sequelize.query(
            `UPDATE "Threads" SET "links" = ? WHERE "id" = ?`,
            {
              replacements: [JSON.stringify(links), thread.id],
              transaction,
            }
          )
        );
      }
    }

    await Promise.all(updatePromises);
    await transaction.commit();
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Threads', 'links');
  },
};
