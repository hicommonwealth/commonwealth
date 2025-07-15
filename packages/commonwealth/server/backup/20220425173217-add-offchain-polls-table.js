module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('OffchainPolls', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chain_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Chains',
          key: 'id',
        },
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OffchainThreads',
          key: 'id',
        },
      },
      prompt: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      options: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('OffchainPolls');
  },
};
