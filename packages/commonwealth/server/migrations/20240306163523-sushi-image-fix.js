'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET body = REPLACE(
          REPLACE(
            REGEXP_REPLACE(body, '_\\d+_\\d+x\\d+(?=\\.\\w+)', '', 'g'), 
            '%2Foptimized%2F', 
            '%2Foriginal%2F'
          ), 
          'https%3A%2F%2Fglobal.discourse-cdn.com%2Fbusiness7%2Fuploads%2Fsushiswapclassic%2F', 
          'https%3A%2F%2Fassets.commonwealth.im%2Fsushiswapclassic%2F'
        )
        WHERE community_id = 'sushi';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Comments"
        SET text = REPLACE(
          REPLACE(
            REGEXP_REPLACE(text, '_\\d+_\\d+x\\d+(?=\\.\\w+)', '', 'g'), 
            '%2Foptimized%2F', 
            '%2Foriginal%2F'
          ), 
          'https%3A%2F%2Fglobal.discourse-cdn.com%2Fbusiness7%2Fuploads%2Fsushiswapclassic%2F', 
          'https%3A%2F%2Fassets.commonwealth.im%2Fsushiswapclassic%2F'
        )
        WHERE community_id = 'sushi';
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
