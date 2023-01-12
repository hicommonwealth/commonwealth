/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let reactions = await queryInterface.sequelize.query(
      `SELECT (id, object_id) FROM "OffchainReactions"`
    );
    reactions = reactions[0].map((rxn) => {
      const [id, object_id] = rxn.row.slice(1, rxn.row.length - 1).split(',');
      return { id, object_id };
    });

    async function populateThreadIds(allReactions) {
      const updated_reactions = {};
      allReactions.forEach(({ id, object_id }) => {
        updated_reactions[id] = object_id.slice(object_id.indexOf('_') + 1);
      });
      return updated_reactions;
    }

    await queryInterface.removeColumn('OffchainReactions', 'object_id', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('OffchainReactions', 'thread_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'OffchainThreads', key: 'id' },
    });
    await queryInterface.addColumn('OffchainReactions', 'comment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'OffchainComments', key: 'id' },
    });
    const updatedReactions = await populateThreadIds(reactions);
    await Promise.all(
      Object.entries(updatedReactions).map(async (rxn) => {
        const rxnId = rxn[0];
        const objId = rxn[1];
        const thread = await queryInterface.sequelize.query(
          `SELECT id FROM "OffchainThreads" WHERE id=${Number(objId)}`
        );
        if (thread[0][0] && thread[0][0].id) {
          const query = `UPDATE "OffchainReactions" SET thread_id=${objId} WHERE id=${Number(
            rxnId
          )}`;
          await queryInterface.sequelize.query(query);
        }
      })
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OffchainReactions', 'comment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'OffchainComments', key: 'id' },
    });

    await queryInterface.addColumn('OffchainReactions', 'object_id', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    let reactions = await queryInterface.sequelize.query(
      `SELECT (id, thread_id) FROM "OffchainReactions"`
    );
    reactions = reactions[0].map((rxn) => {
      const [id, thread_id] = rxn.row.slice(1, rxn.row.length - 1).split(',');
      return { id, thread_id };
    });

    async function populateObjectIds(allReactions) {
      const updated_reactions = {};
      allReactions.forEach(({ id, thread_id }) => {
        updated_reactions[id] = thread_id;
      });
      return updated_reactions;
    }

    const updatedReactions = await populateObjectIds(reactions);
    await Promise.all(
      Object.entries(updatedReactions).map(async (rxn) => {
        const rxnId = rxn[0];
        const threadId = rxn[1];
        const thread = await queryInterface.sequelize.query(
          `SELECT id FROM "OffchainThreads" WHERE id=${Number(threadId)}`
        );
        if (thread[0][0] && thread[0][0].id) {
          const query = `UPDATE "OffchainReactions" SET object_id='discussion_${threadId}' WHERE id=${Number(
            rxnId
          )}`;
          await queryInterface.sequelize.query(query);
        }
      })
    );
    await queryInterface.removeColumn('OffchainReactions', 'thread_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'OffchainThreads', key: 'id' },
    });
  },
};
