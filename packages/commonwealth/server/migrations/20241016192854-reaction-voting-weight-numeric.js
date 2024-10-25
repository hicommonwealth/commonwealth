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

    // 2. Add triggers to keep columns in sync on insert
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

    // 3. Migrate old records in batches
    const BATCH_SIZE = 1000;
    let offset = 0;
    let rowsUpdated;

    // Migrate Reactions table
    console.log('Migrating data for "Reactions" table.');
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        UPDATE "Reactions"
        SET "new_calculated_voting_weight" = "calculated_voting_weight"
        WHERE "id" IN (
          SELECT "id" FROM "Reactions" ORDER BY "id" LIMIT ${BATCH_SIZE} OFFSET ${offset}
        );
      `);
      console.log('ROWS: ', rowsUpdated);
      console.log(
        `Migrated ${rowsUpdated.length} rows for "Reactions" table at offset ${offset}.`,
      );
      offset += BATCH_SIZE;
    } while (rowsUpdated.length > 0);

    offset = 0;
    console.log('Migrating data for "Threads" table.');
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        UPDATE "Threads"
        SET "new_reaction_weights_sum" = "reaction_weights_sum"
        WHERE "id" IN (
          SELECT "id" FROM "Threads" ORDER BY "id" LIMIT ${BATCH_SIZE} OFFSET ${offset}
        );
      `);

      console.log(
        `Migrated ${rowsUpdated.length} rows for "Threads" table at offset ${offset}.`,
      );
      offset += BATCH_SIZE;
    } while (rowsUpdated.length > 0);

    offset = 0;
    console.log('Migrating data for "Comments" table.');
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        UPDATE "Comments"
        SET "new_reaction_weights_sum" = "reaction_weights_sum"
        WHERE "id" IN (
          SELECT "id" FROM "Comments" ORDER BY "id" LIMIT ${BATCH_SIZE} OFFSET ${offset}
        );
      `);

      console.log(
        `Migrated ${rowsUpdated.length} rows for "Comments" table at offset ${offset}.`,
      );
      offset += BATCH_SIZE;
    } while (rowsUpdated.length > 0);

    offset = 0;
    console.log('Migrating data for "Topics" table.');
    do {
      [rowsUpdated] = await queryInterface.sequelize.query(`
        UPDATE "Topics"
        SET "new_vote_weight_multiplier" = "vote_weight_multiplier"
        WHERE "id" IN (
          SELECT "id" FROM "Topics" ORDER BY "id" LIMIT ${BATCH_SIZE} OFFSET ${offset}
        );
      `);

      console.log(
        `Migrated ${rowsUpdated.length} rows for "Topics" table at offset ${offset}.`,
      );
      offset += BATCH_SIZE;
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

  async down(queryInterface, Sequelize) {
    // Down migration remains irreversible due to possible data loss.
  },
};
