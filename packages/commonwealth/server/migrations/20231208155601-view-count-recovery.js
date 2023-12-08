'use strict';
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.RECOVERY_DATABASE_URI;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!connectionString) {
      return; // this is for people running on local. I don't want this to break their db-all.
    }

    const client = new Client({
      connectionString
    });

    await client.connect();

    const viewCounts = await client.query(
      `select object_id, view_count from "ViewCounts" where object_id not ilike '%discussion_%';`
    );

    client.end();

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET view_count = CASE 
            ${viewCounts.rows
          .map(
            (count) =>
              `WHEN id = ${count.object_id} THEN view_count + ${count.view_count}`
          )
          .join(' ')}
        ELSE view_count
        END
        `,
        { transaction: t }
      );
    });
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
