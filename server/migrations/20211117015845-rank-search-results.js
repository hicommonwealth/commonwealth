module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        'UPDATE "OffchainThreads" SET _search = ' +
          "(setweight(to_tsvector('english', coalesce(title, '')), 'A') || " +
          "setweight(to_tsvector('english', coalesce(plaintext, '')), 'D'));",
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        'UPDATE "OffchainComments" SET _search = ' +
          "setweight(to_tsvector('english', coalesce(plaintext, '')), 'C');",
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "UPDATE \"OffchainThreads\" SET _search = to_tsvector('english', title || ' ' || plaintext)",
      { transaction: t }
    );
    await queryInterface.sequelize.query(
      'UPDATE "OffchainComments" SET _search = to_tsvector(\'english\', plaintext)',
      { transaction: t }
    );
  },
};
