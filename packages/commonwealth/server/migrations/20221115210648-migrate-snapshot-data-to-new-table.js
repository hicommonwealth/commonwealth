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
        `INSERT INTO "SnapshotSpaces" (snapshot_space, created_at, updated_at) 
      SELECT DISTINCT UNNEST(snapshot), NOW(), NOW() FROM "Chains";`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO "CommunitySnapshotSpaces" (chain_id, snapshot_space_id, created_at, updated_at)
          SELECT c.id, s.id, NOW(), NOW()
          FROM (SELECT DISTINCT id, UNNEST(snapshot) as snaps FROM "Chains") c
            INNER JOIN "SnapshotSpaces" s
              ON c.snaps = s.snapshot_space;`,
        { transaction: t }
      );

      await queryInterface.removeColumn('Chains', 'snapshot', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.addcolumn(
      'Chains',
      'snapshot',
      {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: true,
      },
      { transaction: t }
    );

    await queryInterface.sequelize.query(
      `UPDATE "Chains" 
          SET snapshot = sn.snaps
        FROM (SELECT css.chain_id, array_agg(ss.snapshot_space) as snaps
              FROM "CommunitySnapshotSpaces" css
              INNER JOIN "SnapshotSpaces" ss ON css.snapshot_space_id = ss.id
              GROUP BY css.chain_id  ) sn
        WHERE "Chains".id = sn.chain_id;`,
      { transaction: t }
    );
  },
};
