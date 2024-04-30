'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      /**
       * Delete entities that have no related chain-events (no creation event)
       */

      // create a table of entities (with no events) that need to be deleted
      await queryInterface.sequelize.query(
        `
                SELECT *
                INTO delete_no_event_entities
                FROM "ChainEntities"
                WHERE NOT EXISTS(
                        SELECT FROM "ChainEvents" WHERE entity_id = "ChainEntities".id
                    );
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id IN (SELECT id FROM delete_no_event_entities);
            `,
        { transaction: t, logging: console.log }
      );

      // create a table of comments that reference deleted entities and need to be deleted themselves
      await queryInterface.sequelize.query(
        `
                CREATE TEMP TABLE comments_to_delete AS (SELECT C.id
                     FROM "Comments" C
                              INNER JOIN delete_no_event_entities CE ON CE.chain = C.chain
                         AND SPLIT_PART(C.root_id, '_', 2) = CE."type_id"
                         AND CE."type" = case SPLIT_PART(C.root_id, '_', 1)
                                              WHEN 'compoundproposal' then 'proposal'
                                              WHEN 'cosmosproposal' then 'proposal'
                                              WHEN 'councilmotion' then 'collective-proposal'
                                              WHEN 'democracyproposal' then 'democracy-proposal'
                                              WHEN 'onchainproposal' then 'proposal'
                                              WHEN 'referendum' then 'democracy-referendum'
                                              WHEN 'signalingproposal' then 'signaling-proposal'
                                              WHEN 'sputnikproposal' then 'proposal'
                                              WHEN 'treasuryproposal' then 'treasury-proposal'
                             END
                     WHERE C.root_id not like 'discussion%');
            `,
        { transaction: t, logging: console.log }
      );
      // delete reactions that reference to be deleted comments
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "Reactions"
                WHERE comment_id IN (SELECT * FROM comments_to_delete);
            `,
        { transaction: t, logging: console.log }
      );
      // delete comments
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "Comments"
                WHERE id IN (SELECT * FROM comments_to_delete);
            `,
        { transaction: t, logging: console.log }
      );

      // delete reactions that reference deleted entities and need to be deleted themselves
      await queryInterface.sequelize.query(
        `
                WITH temp as (SELECT R.id
                              FROM "Reactions" R
                                       INNER JOIN delete_no_event_entities CE ON CE.chain = R.chain
                                  AND SPLIT_PART(R.proposal_id, '_', 2) = CE."type_id"
                                  AND CE."type" = case SPLIT_PART(R.proposal_id, '_', 1)
                                                      WHEN 'compoundproposal' then 'proposal'
                                                      WHEN 'cosmosproposal' then 'proposal'
                                                      WHEN 'councilmotion' then 'collective-proposal'
                                                      WHEN 'democracyproposal' then 'democracy-proposal'
                                                      WHEN 'onchainproposal' then 'proposal'
                                                      WHEN 'referendum' then 'democracy-referendum'
                                                      WHEN 'signalingproposal' then 'signaling-proposal'
                                                      WHEN 'sputnikproposal' then 'proposal'
                                                      WHEN 'treasuryproposal' then 'treasury-proposal'
                                      END
                              WHERE R.proposal_id IS NOT NULL)
                DELETE
                FROM "Reactions"
                WHERE "Reactions".id IN (SELECT id FROM temp);
            `,
        { transaction: t, logging: console.log }
      );

      // clean-up
      await queryInterface.sequelize.query(
        `
                DROP TABLE delete_no_event_entities;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DROP TABlE comments_to_delete;
            `,
        { transaction: t, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};
