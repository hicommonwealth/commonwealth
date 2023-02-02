'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // delete entity 403 (replaced by 715)
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 715
                  AND CE2.id = 403;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEvents" CE
                SET entity_id = 715
                WHERE entity_id = 403;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 403;
            `,
        { transaction: t, logging: console.log }
      );

      // delete entity 692 (replaced by 717)
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 717
                  AND CE2.id = 692;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEvents" CE
                SET entity_id = 717
                WHERE entity_id = 692;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 692;
            `,
        { transaction: t, logging: console.log }
      );

      // delete entity 693 (replaced by 718)
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 718
                  AND CE2.id = 693;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEvents" CE
                SET entity_id = 718
                WHERE entity_id = 693;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 693;
            `,
        { transaction: t, logging: console.log }
      );

      // delete entity 694 (replaced by 719)
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 719
                  AND CE2.id = 694;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEvents" CE
                SET entity_id = 719
                WHERE entity_id = 694;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 694;
            `,
        { transaction: t, logging: console.log }
      );

      // delete entity 109 (replaced by 110)
      // deletes the event that created entity 109 and has the wrong block number
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEvents"
                WHERE id = 19066;
            `,
        { transaction: t, logging: console.log }
      );
      // update the remaining chain-events
      await queryInterface.sequelize.query(
        `
                UPDATE "ChainEvents" CE
                SET entity_id = 110
                WHERE entity_id = 109;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 109;
            `,
        { transaction: t, logging: console.log }
      );

      // deletes entity 506 (replaced by 732)
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEvents"
                WHERE id = 543427;
            `,
        { transaction: t, logging: console.log }
      );
      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id = 506;
            `,
        { transaction: t, logging: console.log }
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
