'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Starting migration: Adding new columns');

    // 1. Create new columns
    await queryInterface.addColumn(
      'Reactions',
      'new_calculated_voting_weight',
      {
        type: Sequelize.NUMERIC(78, 0),
        allowNull: true,
      },
    );
    await queryInterface.addColumn('Threads', 'new_reaction_weights_sum', {
      type: Sequelize.NUMERIC(78, 0),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Comments', 'new_reaction_weights_sum', {
      type: Sequelize.NUMERIC(78, 0),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Topics', 'new_vote_weight_multiplier', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    console.log('New columns added. Setting up triggers for sync.');

    // 2. Add triggers to keep columns in sync on insert and update
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION sync_reactions()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.new_calculated_voting_weight := NEW.calculated_voting_weight;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER reactions_sync_trigger
      BEFORE INSERT OR UPDATE ON "Reactions"
      FOR EACH ROW EXECUTE FUNCTION sync_reactions();

      CREATE OR REPLACE FUNCTION sync_threads()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.new_reaction_weights_sum := NEW.reaction_weights_sum;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER threads_sync_trigger
      BEFORE INSERT OR UPDATE ON "Threads"
      FOR EACH ROW EXECUTE FUNCTION sync_threads();

      CREATE OR REPLACE FUNCTION sync_comments()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.new_reaction_weights_sum := NEW.reaction_weights_sum;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER comments_sync_trigger
      BEFORE INSERT OR UPDATE ON "Comments"
      FOR EACH ROW EXECUTE FUNCTION sync_comments();

      CREATE OR REPLACE FUNCTION sync_topics()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.new_vote_weight_multiplier := NEW.vote_weight_multiplier;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER topics_sync_trigger
      BEFORE INSERT OR UPDATE ON "Topics"
      FOR EACH ROW EXECUTE FUNCTION sync_topics();
    `);

    console.log('Triggers added. Starting batch migration of old data.');

    // 3. Migrate old records in batches using ID-based pagination
    const BATCH_SIZE = 1000;

    // Migrate Reactions table
    console.log('Migrating data for "Reactions" table.');
    let lastId = 0;
    let rowsUpdated;
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        WITH cte AS (
          SELECT "id" FROM "Reactions" WHERE "id" > ${lastId} ORDER BY "id" LIMIT ${BATCH_SIZE}
        )
        UPDATE "Reactions"
        SET "new_calculated_voting_weight" = "calculated_voting_weight"
        FROM cte
        WHERE "Reactions"."id" = cte."id"
        RETURNING "Reactions"."id";
      `);

      if (rowsUpdated.length > 0) {
        lastId = rowsUpdated[rowsUpdated.length - 1].id;
      }
    } while (rowsUpdated.length > 0);

    // Migrate Threads table
    console.log('Migrating data for "Threads" table.');
    lastId = 0;
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        WITH cte AS (
          SELECT "id" FROM "Threads" WHERE "id" > ${lastId} ORDER BY "id" LIMIT ${BATCH_SIZE}
        )
        UPDATE "Threads"
        SET "new_reaction_weights_sum" = "reaction_weights_sum"
        FROM cte
        WHERE "Threads"."id" = cte."id"
        RETURNING "Threads"."id";
      `);

      if (rowsUpdated.length > 0) {
        lastId = rowsUpdated[rowsUpdated.length - 1].id;
      }
    } while (rowsUpdated.length > 0);

    // Migrate Comments table
    console.log('Migrating data for "Comments" table.');
    lastId = 0;
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        WITH cte AS (
          SELECT "id" FROM "Comments" WHERE "id" > ${lastId} ORDER BY "id" LIMIT ${BATCH_SIZE}
        )
        UPDATE "Comments"
        SET "new_reaction_weights_sum" = "reaction_weights_sum"
        FROM cte
        WHERE "Comments"."id" = cte."id"
        RETURNING "Comments"."id";
      `);

      if (rowsUpdated.length > 0) {
        lastId = rowsUpdated[rowsUpdated.length - 1].id;
      }
    } while (rowsUpdated.length > 0);

    // Migrate Topics table
    console.log('Migrating data for "Topics" table.');
    lastId = 0;
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        WITH cte AS (
          SELECT "id" FROM "Topics" WHERE "id" > ${lastId} ORDER BY "id" LIMIT ${BATCH_SIZE}
        )
        UPDATE "Topics"
        SET "new_vote_weight_multiplier" = "vote_weight_multiplier"
        FROM cte
        WHERE "Topics"."id" = cte."id"
        RETURNING "Topics"."id";
      `);

      if (rowsUpdated.length > 0) {
        lastId = rowsUpdated[rowsUpdated.length - 1].id;
      }
    } while (rowsUpdated.length > 0);

    console.log(
      'Data migration complete. Dropping old columns and renaming new columns.',
    );

    // 4. Drop old columns and triggers, rename new columns
    await queryInterface.removeColumn('Reactions', 'calculated_voting_weight');
    await queryInterface.renameColumn(
      'Reactions',
      'new_calculated_voting_weight',
      'calculated_voting_weight',
    );

    await queryInterface.removeColumn('Threads', 'reaction_weights_sum');
    await queryInterface.renameColumn(
      'Threads',
      'new_reaction_weights_sum',
      'reaction_weights_sum',
    );

    await queryInterface.removeColumn('Comments', 'reaction_weights_sum');
    await queryInterface.renameColumn(
      'Comments',
      'new_reaction_weights_sum',
      'reaction_weights_sum',
    );

    await queryInterface.removeColumn('Topics', 'vote_weight_multiplier');
    await queryInterface.renameColumn(
      'Topics',
      'new_vote_weight_multiplier',
      'vote_weight_multiplier',
    );

    console.log('Renaming and cleanup complete. Dropping triggers.');

    // Drop the triggers
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS reactions_sync_trigger ON "Reactions";
      DROP FUNCTION IF EXISTS sync_reactions;

      DROP TRIGGER IF EXISTS threads_sync_trigger ON "Threads";
      DROP FUNCTION IF EXISTS sync_threads;

      DROP TRIGGER IF EXISTS comments_sync_trigger ON "Comments";
      DROP FUNCTION IF EXISTS sync_comments;

      DROP TRIGGER IF EXISTS topics_sync_trigger ON "Topics";
      DROP FUNCTION IF EXISTS sync_topics;
    `);

    console.log('Migration completed successfully.');
  },

  async down(queryInterface, Sequelize) {},
};
