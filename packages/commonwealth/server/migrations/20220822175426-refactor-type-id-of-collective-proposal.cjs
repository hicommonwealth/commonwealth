'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [temp, metadata] = await queryInterface.sequelize.query(
      `
            SELECT EXISTS(
                           SELECT
                           FROM pg_tables
                           WHERE schemaname = 'public'
                             AND tablename = 'entities_creation_events'
                       );
        `,
      { raw: true }
    );
    if (!temp[0].exists) return;

    return await queryInterface.sequelize.transaction(async (t) => {
      // updates comment root_id's for the collective-proposal entities
      await queryInterface.sequelize.query(
        `
                UPDATE "Comments" C
                SET root_id = CONCAT(SPLIT_PART(C.root_id, '_', 1), ECE.event_data ->> 'proposalIndex')
                FROM entities_creation_events ECE
                WHERE SPLIT_PART(C.root_id, '_', 2) = ECE.type_id
                  AND ECE.type = 'collective-proposal'
                  AND SPLIT_PART(C.root_id, '_', 1) = 'councilmotion';
            `,
        { transaction: t }
      );
      // updates reactions root_id's (proposal_ids) for the collective proposal entities
      await queryInterface.sequelize.query(
        `
                UPDATE "Reactions" R
                SET proposal_id = CONCAT(SPLIT_PART(R.proposal_id, '_', 1), ECE.event_data ->> 'proposalIndex')
                FROM entities_creation_events ECE
                WHERE SPLIT_PART(R.proposal_id, '_', 2) = ECE.type_id
                  AND ECE.type = 'collective-proposal'
                  AND SPLIT_PART(R.proposal_id, '_', 1) = 'councilmotion';
            `,
        { transaction: t }
      );

      // update all collective-proposal entities to use proposalIndex instead of proposalHash
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEntities" CE
                SET type_id = ECE.event_data ->> 'proposalIndex'
                FROM entities_creation_events ECE
                WHERE CE.type = 'collective-proposal'
                  AND CE.id = ECE.entity_id;
            `,
        { transaction: t }
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
