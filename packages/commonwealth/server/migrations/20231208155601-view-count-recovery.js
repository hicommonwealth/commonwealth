'use strict';
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.RECOVERY_DATABASE_URI;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!connectionString) {
      return; // this is for people running on local. I don't want this to break their db-all.
    }

    const recoveryClient = new Client({
      connectionString
    });

    await recoveryClient.connect();

    const viewCounts = await recoveryClient.query(
      `select object_id, view_count from "ViewCounts" where object_id not ilike '%discussion_%';`
    );

    recoveryClient.end();

    const query = `
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
        `;

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        query,
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
