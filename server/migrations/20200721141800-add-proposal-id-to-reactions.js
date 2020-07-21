'use strict';

module.exports = {
  up: (queryInterface) => {
    await queryInterface.addColumn('OffchainReactions', 'proposal_id');
  },

  down: (queryInterface) => {
    await queryInterface.removeColum('OffchainReactions', 'proposal_id');
  }
};
