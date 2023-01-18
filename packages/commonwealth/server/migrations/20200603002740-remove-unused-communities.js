'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "DELETE FROM \"OffchainReactions\" WHERE community IN ('zero-knowledge', 'overcommunity', 'edgeware-validators')"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM \"OffchainComments\" WHERE community IN ('zero-knowledge', 'overcommunity', 'edgeware-validators')"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM \"OffchainCommunities\" WHERE id IN ('zero-knowledge', 'overcommunity', 'edgeware-validators')"
    );
  },

  down: (queryInterface, Sequelize) => {
    // nothing to do
  },
};
