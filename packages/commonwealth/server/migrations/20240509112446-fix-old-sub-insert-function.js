'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          CREATE OR REPLACE FUNCTION old_subscriptions_insert()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.category_id = 'chain-event' THEN
                            IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.community_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'snapshot-proposal' THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (
                  NEW.subscriber_id, 
                  (SELECT id FROM "Communities" WHERE NEW.snapshot_id = ANY(snapshot_spaces) LIMIT 1), 
                  NEW.created_at, NEW.updated_at
                );
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.comment_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommentSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND comment_id = NEW.comment_id
              ) THEN
                INSERT INTO "CommentSubscriptions" (user_id, comment_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.comment_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.thread_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "ThreadSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND thread_id = NEW.thread_id
              ) THEN
                INSERT INTO "ThreadSubscriptions" (user_id, thread_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.thread_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          CREATE OR REPLACE FUNCTION old_subscriptions_insert()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.category_id IN ('chain-event', 'snapshot-proposal') THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.community_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.comment_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommentSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND comment_id = NEW.comment_id
              ) THEN
                INSERT INTO "CommentSubscriptions" (user_id, comment_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.comment_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.thread_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "ThreadSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND thread_id = NEW.thread_id
              ) THEN
                INSERT INTO "ThreadSubscriptions" (user_id, thread_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.thread_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );
    });
  },
};
