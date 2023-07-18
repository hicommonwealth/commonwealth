'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     Create all triggers
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION update_comment_count_insert()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE "Threads"
          SET comment_count = comment_count + 1
          WHERE id = NEW.thread_id;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_count_insert'
            ) THEN
                DROP TRIGGER update_comment_count_insert ON "Comments";
            END IF;
        
            CREATE TRIGGER update_comment_count_insert
            AFTER INSERT ON "Comments"
            FOR EACH ROW
            EXECUTE FUNCTION update_comment_count_insert();
        END $$;
        
        CREATE OR REPLACE FUNCTION update_comment_count_logical_delete()
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE "Threads"
            SET comment_count = comment_count - 1
            WHERE id = OLD.thread_id;
          END IF;
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
        
        
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_count_logical_delete'
            ) THEN
                DROP TRIGGER update_comment_count_logical_delete ON "Comments";
            END IF;
        
            CREATE TRIGGER update_comment_count_logical_delete
            AFTER UPDATE ON "Comments"
            FOR EACH ROW
            EXECUTE FUNCTION update_comment_count_logical_delete();
        END $$;
        
        
        CREATE OR REPLACE FUNCTION update_max_notif_id()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.category_id IN ('new-thread-creation', 'new-comment-creation') THEN
            UPDATE "Threads"
            SET max_notif_id = NEW.id
            WHERE id = NEW.thread_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_max_notif_id'
          ) THEN
            DROP TRIGGER update_max_notif_id ON "Notifications";
          END IF;
          CREATE TRIGGER update_max_notif_id
          AFTER INSERT ON "Notifications"
          FOR EACH ROW
          EXECUTE FUNCTION update_max_notif_id();
        END $$;

        CREATE OR REPLACE FUNCTION update_reaction_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.thread_id IS NOT NULL THEN
            UPDATE "Threads"
            SET reaction_count = reaction_count + 1
            WHERE id = NEW.thread_id;
          END IF;
          
          IF NEW.comment_id IS NOT NULL THEN
            UPDATE "Comments"
            SET reaction_count = reaction_count + 1
            WHERE id = NEW.comment_id;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'reaction_count_trigger'
          ) THEN
            DROP TRIGGER reaction_count_trigger ON "Reactions";
          END IF;
          CREATE TRIGGER reaction_count_trigger
          AFTER INSERT ON "Reactions"
          FOR EACH ROW
          EXECUTE FUNCTION update_reaction_count();
        END $$;


        CREATE OR REPLACE FUNCTION decrement_reaction_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.thread_id IS NOT NULL THEN
            UPDATE "Threads"
            SET reaction_count = reaction_count - 1
            WHERE id = OLD.thread_id;
          END IF;
          
          IF OLD.comment_id IS NOT NULL THEN
            UPDATE "Comments"
            SET reaction_count = reaction_count - 1
            WHERE id = OLD.comment_id;
          END IF;
            
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;

        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'reaction_count_decrement_trigger'
          ) THEN
            DROP TRIGGER reaction_count_decrement_trigger ON "Reactions";
          END IF;
          CREATE TRIGGER reaction_count_decrement_trigger
          AFTER DELETE ON "Reactions"
          FOR EACH ROW
          EXECUTE FUNCTION decrement_reaction_count();
        END $$;


        `,
        { raw: true, transaction: t, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     Remove all triggers
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        IF EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_count_insert'
        ) THEN
          DROP TRIGGER update_comment_count_insert ON "Comments";
        END IF;
    
        IF EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_count_delete'
        ) THEN
          DROP TRIGGER update_comment_count_delete ON "Comments";
        END IF;
    
        IF EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_max_notif_id'
        ) THEN
          DROP TRIGGER update_max_notif_id ON "Notifications";
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'reaction_count_trigger'
        ) THEN
          DROP TRIGGER reaction_count_trigger ON "Reactions";
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'reaction_count_decrement_trigger'
        ) THEN
          DROP TRIGGER reaction_count_decrement_trigger ON "Reactions";
        END IF;
        `,
        { raw: true, transaction: t, logging: console.log }
      );
    });
  },
};
