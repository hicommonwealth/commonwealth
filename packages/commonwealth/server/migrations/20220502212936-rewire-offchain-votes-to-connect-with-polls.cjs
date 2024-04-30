module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainVotes',
        'poll_id',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'OffchainPolls',
            key: 'id',
            as: 'poll',
          },
        },
        { transaction: t }
      );
      const getThreadsQuery = `SELECT * FROM "OffchainThreads" WHERE has_poll = TRUE`;
      const threads = await queryInterface.sequelize.query(getThreadsQuery, {
        transaction: t,
      });
      await threads[0].map(async (thread) => {
        const { id } = thread;
        const getPollsQuery = `SELECT id FROM "OffchainPolls" WHERE thread_id = ?`;
        const res = await queryInterface.sequelize.query(
          getPollsQuery,
          {
            replacements: [id],
          },
          { transaction: t }
        );
        const poll_id = res[0][0]?.id;
        if (id && poll_id) {
          const updatePollsQuery = `UPDATE "OffchainVotes" SET poll_id = ? WHERE thread_id = ?`;
          await queryInterface.sequelize.query(
            updatePollsQuery,
            {
              replacements: [poll_id, id],
            },
            { transaction: t }
          );
        }
      });
    });
  },

  down: async (queryInterface) => {
    // TODO: Do we want to take the time to do a complete reversal transfer?
    // Would run into some issues b/c going backwards, there isn't a 1:1 thread:poll ratio
    return queryInterface.removeColumn('OffchainVotes', 'poll_id');
  },
};
