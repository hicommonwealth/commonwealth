module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('OffchainVotes', 'chain', 'chain_id');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('OffchainVotes', 'chain_id', 'chain');
  },
};
