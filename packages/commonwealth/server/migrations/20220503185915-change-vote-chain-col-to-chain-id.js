module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('OffchainVotes', 'thread_id');
    await queryInterface.renameColumn('OffchainVotes', 'chain', 'chain_id');
    return new Promise((resolve) => resolve());
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn(
      'OffchainVotes',
      'thread_id',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      { transaction: t }
    );
    await queryInterface.renameColumn('OffchainVotes', 'chain_id', 'chain');
    return new Promise((resolve) => resolve());
  },
};
