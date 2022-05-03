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
        try {
          const { id } = thread;
          const getPollsQuery = `SELECT id FROM "OffchainPolls" WHERE thread_id=?`;
          const res = await queryInterface.sequelize.query(
            getPollsQuery,
            {
              replacements: [id],
            },
            { transaction: t }
          );
          const poll_id = res[0][0].id;
          const updatePollsQuery = `UPDATE "OffchainVotes" SET poll_id=? WHERE thread_id=?`;
          await queryInterface.sequelize.query(
            updatePollsQuery,
            {
              replacements: [poll_id, id],
            },
            { transaction: t }
          );
        } catch (e) {
          console.log(thread);
          throw new Error();
        }
      });
      await queryInterface.removeColumn('OffchainVotes', 'thread_id', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // TODO: Complete data transfer
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainVotes', 'poll_id', {
        transaction: t,
      });
      await queryInterface.addColumn(
        'OffchainVotes',
        'thread_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction: t }
      );
    });
  },
};
