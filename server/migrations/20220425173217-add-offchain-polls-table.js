module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('OffchainPolls', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Chain',
          key: 'id',
        },
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OffchainThread',
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
      votes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeTable('OffchainPolls');
  },
};
