'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
-- Step 1: Create a new partitioned table with the same structure
CREATE TABLE public."Threads_partitioned"
(
    id                      integer      default nextval('"OffchainThreads_id_seq"'::regclass) not null,
    address_id              integer
        constraint "Threads_partitioned_author_id_fkey"
            references public."Addresses"
            on update cascade on delete set null,
    title                   text                                                               not null,
    body                    varchar(2000)                                                      not null,
    created_at              timestamp with time zone                                           not null,
    updated_at              timestamp with time zone                                           not null,
    deleted_at              timestamp with time zone,
    community_id            varchar(255) default NULL::character varying                       not null,
    pinned                  boolean      default false                                         not null,
    kind                    varchar(255)                                                       not null,
    url                     text,
    read_only               boolean      default false                                         not null,
    topic_id                integer                                                            not null
        references public."Topics"
            on update cascade on delete set null,
    stage                   text         default 'discussion'::text                            not null,
    has_poll                boolean,
    last_commented_on       timestamp with time zone,
    search                  tsvector                                                           not null,
    canvas_msg_id           varchar(255),
    links                   jsonb,
    last_edited             timestamp with time zone,
    locked_at               timestamp with time zone,
    created_by              varchar(255),
    marked_as_spam_at       timestamp with time zone,
    archived_at             timestamp with time zone,
    discord_meta            jsonb,
    comment_count           integer      default 0                                             not null,
    reaction_count          integer      default 0                                             not null,
    reaction_weights_sum    numeric(78)  default 0                                             not null,
    view_count              integer      default 0                                             not null,
    canvas_signed_data      jsonb,
    activity_rank_date      timestamp with time zone,
    content_url             varchar(255),
    launchpad_token_address varchar(255),
    is_linking_token        boolean      default false                                         not null,
    PRIMARY KEY (id, marked_as_spam_at IS NULL)  -- Include partition key in primary key
) PARTITION BY LIST (marked_as_spam_at IS NULL);

-- Step 2: Create two partitions
-- Partition for non-spam threads (marked_as_spam_at IS NULL)
CREATE TABLE public."Threads_not_spam" PARTITION OF public."Threads_partitioned"
    FOR VALUES IN (true);

-- Partition for spam threads (marked_as_spam_at IS NOT NULL)
CREATE TABLE public."Threads_spam" PARTITION OF public."Threads_partitioned"
    FOR VALUES IN (false);

-- Step 3: Create indexes with original names on the non-spam partition
-- This approach creates all the indexes directly on the specific partition
-- but uses the original index names for ORM compatibility
CREATE INDEX "OffchainThreads_search"
    ON public."Threads_not_spam" USING gin (search);

CREATE INDEX threads_author_id
    ON public."Threads_not_spam" (address_id);

CREATE INDEX threads_community_id_created_at
    ON public."Threads_not_spam" (community_id, created_at);

CREATE INDEX threads_community_id_pinned
    ON public."Threads_not_spam" (community_id, pinned);

CREATE INDEX threads_community_id_updated_at
    ON public."Threads_not_spam" (community_id, updated_at);

CREATE INDEX threads_created_at
    ON public."Threads_not_spam" (created_at);

CREATE INDEX threads_title_trgm_idx
    ON public."Threads_not_spam" USING gin (title public.gin_trgm_ops);

CREATE INDEX threads_activity_rank_date
    ON public."Threads_not_spam" (activity_rank_date DESC);

CREATE INDEX threads_is_linking_token
    ON public."Threads_not_spam" (is_linking_token);

-- Step 4: Migrate data from the old table to the new partitioned table
INSERT INTO public."Threads_partitioned" 
SELECT * FROM public."Threads";

-- Step 5: Swap tables (this will require a brief exclusive lock)
ALTER TABLE public."Threads" RENAME TO "Threads_old";
ALTER TABLE public."Threads_partitioned" RENAME TO "Threads";
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
