'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const taggedThreads = await queryInterface.sequelize.query(
      'SELECT * FROM "TaggedThreads";'
    );
    const handledThreads = {};
    await Promise.all(
      taggedThreads[0].map(async (row) => {
        const { tag_id, thread_id } = row;
        if (!handledThreads[thread_id]) {
          handledThreads[thread_id] = Number(tag_id);
        }
      })
    );
    await Promise.all(
      Object.keys(handledThreads).map(async (thread_id) => {
        const tag_id = handledThreads[thread_id];
        const query = `UPDATE "OffchainThreads" SET tag_id=${tag_id} WHERE id=${thread_id};`;
        await queryInterface.sequelize.query(query);
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
