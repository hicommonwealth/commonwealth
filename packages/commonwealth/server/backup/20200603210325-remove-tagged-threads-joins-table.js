'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('TaggedThreads');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TaggedThreads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tag_id: { type: Sequelize.INTEGER, allowNull: false },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    const [threads] = await queryInterface.sequelize.query(
      'SELECT * FROM "OffchainThreads";'
    );
    await Promise.all(
      threads.map(async (thread) => {
        const { id, tag_id } = thread;
        if (tag_id) {
          const query = `INSERT INTO "TaggedThreads" (tag_id, thread_id, created_at, updated_at) VALUES (${tag_id}, ${id}, NOW(), NOW())`;
          await queryInterface.sequelize.query(query);
        }
      })
    );
  },
};
