'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('TaggedThreads');
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('TaggedThreads', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      tag_id: { type: DataTypes.INTEGER, allowNull: false },
      thread_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    const [threads] = await queryInterface.sequelize.query('SELECT * FROM "OffchainThreads";');
    await Promise.all(threads.map(async (thread) => {
      const { id, tag_id } = thread;
      if (tag_id) {
        const query = `INSERT INTO "TaggedThreads" (tag_id, thread_id, created_at, updated_at) VALUES (${tag_id}, ${id}, NOW(), NOW())`;
        await queryInterface.sequelize.query(query);
      }
    }));
  }
};
