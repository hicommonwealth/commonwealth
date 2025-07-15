'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // add threads index
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" ADD COLUMN _search TSVECTOR',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        "UPDATE \"OffchainThreads\" SET _search = to_tsvector('english', title || ' ' || plaintext)",
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE INDEX "OffchainThreads_search" ON "OffchainThreads" USING gin(_search)',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE TRIGGER "OffchainThreads_vector_update" BEFORE INSERT OR UPDATE ON "OffchainThreads" ' +
          "FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, 'pg_catalog.english', title, plaintext)",
        { transaction: t }
      );

      // add comments index
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainComments" ADD COLUMN _search TSVECTOR',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'UPDATE "OffchainComments" SET _search = to_tsvector(\'english\', plaintext)',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE INDEX "OffchainComments_search" ON "OffchainComments" USING gin(_search)',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'CREATE TRIGGER "OffchainComments_vector_update" BEFORE INSERT OR UPDATE ON "OffchainComments" ' +
          "FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(_search, 'pg_catalog.english', plaintext)",
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // remove threads index
      await queryInterface.sequelize.query(
        'DROP TRIGGER "OffchainThreads_vector_update" ON "OffchainThreads";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP INDEX "OffchainThreads_search";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainThreads" DROP COLUMN _search;',
        { transaction: t }
      );

      // remove comments index
      await queryInterface.sequelize.query(
        'DROP TRIGGER "OffchainComments_vector_update" ON "OffchainComments";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP INDEX "OffchainComments_search";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "OffchainComments" DROP COLUMN _search;',
        { transaction: t }
      );
    });
  },
};
