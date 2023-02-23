'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Threads', 'view_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
    );

    // remove discussion_ portion from object_id
    await queryInterface.sequelize.query(
      `UPDATE "ViewCounts" SET "object_id" = regexp_replace(object_id, '^discussion_(.*)', '\\1')`,
    );

    const viewCounts = await queryInterface.sequelize.query(
      `SELECT * FROM "ViewCounts"`
    );

    const viewCountMap = new Map(viewCounts[0].map(v => [v.object_id, v]));

    const threads = await queryInterface.sequelize.query(
      `SELECT * FROM "Threads"`
    );

    const updateQueries = [];
    threads[0].forEach(thread => {
      if (viewCountMap.has(thread.id.toString())) {
        updateQueries.push(
          queryInterface.sequelize.query(
            `UPDATE "Threads" 
               SET "view_count" = ${viewCountMap.get(thread.id.toString()).view_count}
               WHERE "id" = ${thread.id}`,
          )
        );
      }
    });

    await Promise.all(updateQueries);

    await queryInterface.dropTable('ViewCounts');
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
