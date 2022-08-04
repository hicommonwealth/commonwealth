'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Threads', 'chain_entity_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      }, { transaction: t });

      await queryInterface.sequelize.query(
        `UPDATE "Threads" AS T
        SET chain_entity_id = C.id
        FROM (SELECT id, thread_id
                FROM "ChainEntities"
                WHERE thread_id IS NOT NULL) AS C(id, thread_id)
         WHERE T.id = C.thread_id;`,
        { transaction: t, type: 'UPDATE', raw: true }
      );

      await queryInterface.removeColumn('ChainEntities',
        'thread_id',
        { transaction: t }
      );
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('ChainEntities', 'thread_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction: t });

      await queryInterface.sequelize.query(
        `UPDATE "ChainEntities" AS C
        SET thread_id = T.id
        FROM (SELECT id, chain_entity_id
                FROM "Threads"
                WHERE chain_entity_id IS NOT NULL) AS T(id, chain_entity_id)
        WHERE C.id = T.chain_entity_id;`,
        { transaction: t, type: 'UPDATE', raw: true }
      );

      await queryInterface.removeColumn('Threads',
        'chain_entity_id',
        { transaction: t }
      );
    })
  }
};
