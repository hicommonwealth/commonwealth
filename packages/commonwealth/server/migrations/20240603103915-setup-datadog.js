'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // https://docs.datadoghq.com/database_monitoring/setup_postgres/selfhosted/?tab=postgres15#grant-the-agent-access
    await queryInterface.sequelize.transaction(async (transaction) => {
      const res = await queryInterface.sequelize.query(
        `
         SELECT *
         FROM pg_roles
         WHERE rolname = 'datadog';
     `,
        { transaction, type: Sequelize.QueryTypes.SELECT, raw: true },
      );

      console.log(
        '>>>>>>>>> DBM setup testing',
        process.env.DD_ENABLE_DBM,
        res,
      );
      if (res.length === 0 && process.env.DD_ENABLE_DBM === 'true') {
        throw new Error(
          'A datadog user is required for database monitoring in Datadog',
        );
      } else if (res.length === 1) {
        await queryInterface.sequelize.query(
          `
          CREATE SCHEMA IF NOT EXISTS datadog;
          GRANT USAGE ON SCHEMA datadog TO datadog;
          GRANT USAGE ON SCHEMA public TO datadog;
          GRANT pg_monitor TO datadog;
          CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
          
          CREATE OR REPLACE FUNCTION datadog.explain_statement(
             l_query TEXT,
             OUT explain JSON
          )
          RETURNS SETOF JSON AS
          $$
          DECLARE
          curs REFCURSOR;
          plan JSON;
          
          BEGIN
             OPEN curs FOR EXECUTE pg_catalog.concat('EXPLAIN (FORMAT JSON) ', l_query);
             FETCH curs INTO plan;
             CLOSE curs;
             RETURN QUERY SELECT plan;
          END;
          $$
          LANGUAGE 'plpgsql'
          RETURNS NULL ON NULL INPUT
          SECURITY DEFINER;
     `,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // the datadog user cannot be managed via migration
      await queryInterface.sequelize.query(
        `
        DROP FUNCTION IF EXISTS datadog.explain_statement;
        DROP SCHEMA IF EXISTS datadog;
      `,
        { transaction },
      );
    });
  },
};
