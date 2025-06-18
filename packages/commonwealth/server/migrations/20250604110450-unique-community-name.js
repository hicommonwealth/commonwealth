'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Assumes that any community not listed here with a duplicate name has been deleted
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET name = CASE
                     WHEN id = 'andromeda-governance' THEN 'Andromeda Governance'
                     WHEN id = 'commonwealth' THEN 'Commonwealth' -- OR DELETE
                     WHEN id = 'el-team-de-nico' THEN 'El Team De Nico'
                     WHEN id = 'flexusd' THEN 'Flex USD'
                     WHEN id = 'rmixs-team' THEN 'RMIXS Team'
                     WHEN id = 'medibloc-forum' THEN 'MediBloc Forum'
                     WHEN id = 'spice-people' THEN 'Spice People'
                     WHEN id = 'vdl' THEN 'VDL'
          END
        WHERE id in (
           'andromeda-governance', 'commonwealth', 'el-team-de-nico', 
           'flexusd', 'rmixs-team', 'medibloc-forum', 'spice-people', 'vdl'
        );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE INDEX community_name_trgm_idx ON "Communities" USING gin (name gin_trgm_ops);
      `,
        { transaction },
      );

      await queryInterface.addIndex('Communities', ['name'], {
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Communities',
        'community_name_trgm_idx',
        {
          transaction,
        },
      );
      await queryInterface.removeIndex('Communities', ['name'], {
        transaction,
      });
    });
  },
};
