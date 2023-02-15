'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn(
      'Users',
      'selected_node_id',
      'selectedNodeId'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn(
      'Users',
      'selectedNodeId',
      'selected_node_id'
    );
  },
};
