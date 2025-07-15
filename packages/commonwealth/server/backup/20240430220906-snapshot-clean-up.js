'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          DROP TABLE "SnapshotProposals";

          ALTER TABLE "Communities"
              ADD COLUMN "snapshot_spaces" VARCHAR(255)[] NOT NULL DEFAULT '{}';

          WITH spaces AS (
              SELECT community_id, array_agg(snapshot_space_id) as snapshot_space_ids
              FROM "CommunitySnapshotSpaces"
              GROUP BY community_id
          ) UPDATE "Communities"
          SET "snapshot_spaces" = spaces.snapshot_space_ids
          FROM spaces
          WHERE "Communities"."id" = spaces.community_id;

          DROP TABLE "CommunitySnapshotSpaces";
          DROP TABLE "SnapshotSpaces";

          CREATE INDEX "Communities_snapshot_spaces" ON "Communities"("snapshot_spaces");
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
            create table "SnapshotSpaces"
            (
                snapshot_space varchar(255)             not null
                    primary key,
                created_at     timestamp with time zone not null,
                updated_at     timestamp with time zone not null
            );

            create table "CommunitySnapshotSpaces"
            (
                id                serial
                    primary key,
                snapshot_space_id varchar(255)             not null,
                community_id      varchar(255)             not null,
                created_at        timestamp with time zone not null,
                updated_at        timestamp with time zone not null
            );

            create table "SnapshotProposals"
            (
                id                  varchar(255)             not null
                    primary key,
                title               varchar(255),
                body                text,
                choices             varchar(255)[],
                space               varchar(255)             not null,
                event               varchar(255),
                start               varchar(255),
                expire              varchar(255),
                is_upstream_deleted boolean default false    not null,
                "createdAt"         timestamp with time zone not null,
                "updatedAt"         timestamp with time zone not null
            );

            INSERT INTO "SnapshotSpaces"(snapshot_space, created_at, updated_at)
            SELECT DISTINCT UNNEST(C.snapshot_spaces), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM "Communities" C
            ON CONFLICT (snapshot_space) DO NOTHING;

            INSERT INTO "CommunitySnapshotSpaces" (community_id, snapshot_space_id)
            SELECT C.id, UNNEST(C.snapshot_spaces)
            FROM "Communities" C;
        `,
        { transaction },
      );
    });
  },
};
