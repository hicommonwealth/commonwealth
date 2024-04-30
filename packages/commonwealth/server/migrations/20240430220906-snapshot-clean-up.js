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
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
