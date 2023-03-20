'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Threads', 'view_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    // remove discussion_ portion from object_id
    await queryInterface.sequelize.query(
      `UPDATE "ViewCounts" SET "object_id" = regexp_replace(object_id, '^discussion_(.*)', '\\1')`
    );

    const viewCounts = await queryInterface.sequelize.query(
      `SELECT * FROM "ViewCounts"`
    );

    if (viewCounts[0].length > 0) {
      const viewCountMap = new Map(viewCounts[0].map((v) => [v.object_id, v]));

      const threads = await queryInterface.sequelize.query(
        `SELECT id FROM "Threads"`
      );

      const updateQueries = [];
      threads[0].forEach((thread) => {
        if (viewCountMap.has(thread.id.toString())) {
          updateQueries.push(
            queryInterface.sequelize.query(
              `UPDATE "Threads"
               SET "view_count" = ${
                 viewCountMap.get(thread.id.toString()).view_count
               }
               WHERE "id" = ${thread.id}`
            )
          );
        }
      });

      await Promise.all(updateQueries);
    }

    await queryInterface.dropTable('ViewCounts');
  },

  down: async (queryInterface, Sequelize) => {
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
      }
    );

    const threads = await queryInterface.sequelize.query(
      `SELECT id, chain, view_count FROM "Threads"`
    );

    const updateQueries = [];
    threads[0].forEach((t) => {
      updateQueries.push(
        queryInterface.sequelize.query(
          `INSERT INTO "ViewCounts" (chain, object_id, view_count)
         VALUES ('${t.chain}', 'discussion_${t.id}', ${t.view_count})`
        )
      );
    });

    await Promise.all(updateQueries);

    return queryInterface.removeColumn('Threads', 'view_count');
  },
};
