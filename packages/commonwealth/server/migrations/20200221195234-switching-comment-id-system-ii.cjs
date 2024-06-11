/* eslint-disable quotes */
/* eslint-disable no-restricted-syntax */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let comments = await queryInterface.sequelize.query(
      `SELECT (id, parent_id, parent_type) FROM "OffchainComments"`
    );
    comments = comments[0].map((comment) => {
      const [id, parent_id, parent_type] = comment.row
        .slice(1, comment.row.length - 1)
        .split(',');
      return { id, parent_id, parent_type };
    });

    function findRoot(allComments, parentId) {
      const parentComment = allComments.find((c) => c.id === parentId);
      return parentComment.parent_id;
    }

    async function populateRootIds(allComments) {
      const updated_comments = {};
      allComments.forEach((comment) => {
        const { id, parent_id, parent_type } = comment;
        if (parent_type === 'comment') {
          const root_id = findRoot(allComments, parent_id);
          updated_comments[id] = { root_id, parent_id };
        } else {
          updated_comments[id] = { root_id: parent_id, parent_id: null };
        }
      });
      return updated_comments;
    }

    const updatedComments = await populateRootIds(comments);
    await Promise.all(
      Object.entries(updatedComments).map(async (entry) => {
        const comment_id = entry[0];
        let { root_id, parent_id } = entry[1];
        if (!parent_id) parent_id = null;
        const queryTable = `UPDATE "OffchainComments" `;
        const queryValues = parent_id
          ? `SET root_id='${root_id}', parent_id='${parent_id}' `
          : `SET root_id='${root_id}', parent_id=NULL `;
        const queryConditional = `WHERE id='${comment_id}'`;
        await queryInterface.sequelize.query(
          queryTable + queryValues + queryConditional
        );
      })
    );
    await queryInterface.removeColumn('OffchainComments', 'parent_type', {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OffchainComments', 'parent_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'proposal',
    });
    let comments = await queryInterface.sequelize.query(
      `SELECT (id, parent_id, root_id) FROM "OffchainComments"`
    );
    comments = comments[0].map((comment) => {
      const [id, parent_id, root_id] = comment.row
        .slice(1, comment.row.length - 1)
        .split(',');
      return { id, parent_id, root_id };
    });
    await Promise.all(
      comments.map(async (comment) => {
        let { parent_id, root_id } = comment;
        const parent_type = parent_id ? 'comment' : 'proposal';
        if (!parent_id) parent_id = root_id;
        const queryTable = `UPDATE "OffchainComments" `;
        const queryValues = `SET parent_id='${parent_id}', root_id=NULL, parent_type='${parent_type}' `;
        const queryConditional = `WHERE id='${comment.id}'`;
        await queryInterface.sequelize.query(
          queryTable + queryValues + queryConditional
        );
      })
    );
  },
};
