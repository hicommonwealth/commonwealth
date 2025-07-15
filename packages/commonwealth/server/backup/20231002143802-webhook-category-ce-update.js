'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // transforms categories array to remove CET
      // {new-thread-creation, kulupu-proposal-created, edgeware-proposal-canceled} =>
      // {new-thread-creation, chain-event}
      await queryInterface.sequelize.query(
        `
        WITH normalized AS (
          SELECT 
              id, 
              CASE 
                  WHEN unnested IN ('new-thread-creation', 'new-comment-creation', 'new-comment-reaction') 
                  THEN unnested 
                  ELSE 'chain-event' 
              END as category
          FROM "Webhooks", unnest(categories) AS unnested
        )
        
        UPDATE "Webhooks" w
        SET categories = ARRAY(
            SELECT DISTINCT category
            FROM normalized n
            WHERE n.id = w.id
        );
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible without table backup
  },
};
