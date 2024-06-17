'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('NotificationsRead', { transaction });
      await queryInterface.dropTable('Notifications', { transaction });
      await queryInterface.dropTable('Subscriptions', { transaction });
      await queryInterface.dropTable('NotificationCategories', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          create table "NotificationCategories"
          (
              name        varchar(255) not null
                  primary key,
              description text         not null,
              created_at  timestamp with time zone,
              updated_at  timestamp with time zone
          );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          create table "Notifications"
          (
              id                integer default nextval('"Notifications_id_seq1"'::regclass) not null
                  constraint "Notifications_pkey1"
                      primary key,
              notification_data text,
              created_at        timestamp with time zone                                     not null,
              updated_at        timestamp with time zone                                     not null,
              chain_event_id    integer
                  constraint "Notifications_unique_chain_event_id"
                      unique,
              community_id      varchar(255)
                  references "Communities",
              category_id       varchar(255)                                                 not null
                  references "NotificationCategories",
              entity_id         integer,
              thread_id         integer
          );

          create index notifications_thread_id
              on "Notifications" (thread_id);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          create table "Subscriptions"
          (
              id              integer default nextval('"Subscriptions_id_seq"'::regclass) not null
                  primary key,
              subscriber_id   integer                                                     not null
                  references "Users",
              category_id     varchar(255)                                                not null
                  references "NotificationCategories",
              is_active       boolean default true                                        not null,
              created_at      timestamp with time zone                                    not null,
              updated_at      timestamp with time zone                                    not null,
              immediate_email boolean default false                                       not null,
              community_id    varchar(255),
              thread_id       integer,
              comment_id      integer,
              snapshot_id     varchar(255),
              constraint chk_community_id_on_chain_event
                  check (((category_id)::text <> 'chain-event'::text) OR
                         (((category_id)::text = 'chain-event'::text) AND (community_id IS NOT NULL))),
              constraint chk_community_id_on_new_thread
                  check (((category_id)::text <> 'new-thread-creation'::text) OR
                         (((category_id)::text = 'new-thread-creation'::text) AND (community_id IS NOT NULL))),
              constraint chk_snapshot_id_on_snapshot_proposal
                  check (((category_id)::text <> 'snapshot-proposal'::text) OR
                         (((category_id)::text = 'snapshot-proposal'::text) AND (snapshot_id IS NOT NULL))),
              constraint chk_thread_id_comment_id_on_new_comment_creation
                  check (((category_id)::text <> 'new-comment-creation'::text) OR
                         (((category_id)::text = 'new-comment-creation'::text) AND
                          (((thread_id IS NOT NULL) AND (comment_id IS NULL)) OR
                           ((thread_id IS NULL) AND (comment_id IS NOT NULL))))),
              constraint chk_thread_id_comment_id_on_new_reaction
                  check (((category_id)::text <> 'new-reaction'::text) OR
                         (((category_id)::text = 'new-reaction'::text) AND
                          (((thread_id IS NOT NULL) AND (comment_id IS NULL)) OR
                           ((thread_id IS NULL) AND (comment_id IS NOT NULL)))))
          );

          create index subscriptions_subscriber_id
              on "Subscriptions" (subscriber_id);

          create index subscriptions_thread_id
              on "Subscriptions" (thread_id);

          create trigger activating_subscription_trigger
              after update
              on "Subscriptions"
              for each row
              when (new.is_active = true AND old.is_active = false)
          execute procedure old_subscriptions_insert();

          create trigger deactivating_subscription_trigger
              after update
              on "Subscriptions"
              for each row
              when (new.is_active = false AND old.is_active = true)
          execute procedure old_subscriptions_delete();

          create trigger old_subscriptions_delete_trigger
              after delete
              on "Subscriptions"
              for each row
          execute procedure old_subscriptions_delete();

          create trigger old_subscriptions_insert_trigger
              after insert
              on "Subscriptions"
              for each row
          execute procedure old_subscriptions_insert();
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          create table "NotificationsRead"
          (
              notification_id integer not null,
              subscription_id integer not null,
              is_read         boolean not null,
              user_id         integer not null
                  references "Users",
              primary key (notification_id, subscription_id)
          );

          create index "NotificationsRead_user_index"
              on "NotificationsRead" (user_id);

          create index notifications_read_subscription_id_index
              on "NotificationsRead" (subscription_id);
      `,
        { transaction },
      );
    });
  },
};
