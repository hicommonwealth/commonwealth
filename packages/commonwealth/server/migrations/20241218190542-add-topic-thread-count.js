'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Topics" ADD COLUMN thread_count INTEGER NOT NULL DEFAULT 0;

        -- Populate initial counts
        UPDATE "Topics" t
        SET thread_count = (
          SELECT Count(*)
          FROM "Threads" th
          WHERE th.topic_id = t.id
          AND th.deleted_at IS NULL
        );

        -- Add trigger to maintain counts
        CREATE OR REPLACE FUNCTION update_topic_thread_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
            UPDATE "Topics" SET thread_count = thread_count + 1 WHERE id = NEW.topic_id;
          ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            UPDATE "Topics" SET thread_count = thread_count - 1 WHERE id = NEW.topic_id;
          ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
            UPDATE "Topics" SET thread_count = thread_count + 1 WHERE id = NEW.topic_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER threads_topic_count_trigger
        AFTER INSERT OR UPDATE ON "Threads"
        FOR EACH ROW
        EXECUTE FUNCTION update_topic_thread_count();
      `,
        {
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS threads_topic_count_trigger ON "Threads";
        DROP FUNCTION IF EXISTS update_topic_thread_count();
        ALTER TABLE "Topics" DROP COLUMN IF EXISTS thread_count;
      `,
        {
          transaction,
        },
      );
    });
  },
};
