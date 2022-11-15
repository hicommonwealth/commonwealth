'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `INSERT INTO "SnapshotSpaces" (snapshot_space) 
      SELECT DISTINCT UNNEST(snapshots) FROM "Chains";`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO CommunitySnapshotSpaces (chain_id, snapshot_space_id)
      SELECT c.id, s.id 
      FROM (SELECT DISTINCT id, UNNEST(snapshots) as snaps FROM "Chains") c
       INNER JOIN "SnapshotSpaces" s
      ON c.snaps = s.snapshot_space`,
        { transaction: t }
      );

      await queryInterface.sequelize.removeColumn('Chains', 'snapshots', {
        transaction: t,
      });
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
