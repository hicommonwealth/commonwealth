'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ChainEntityMeta');
  },

  down: async (queryInterface, Sequelize) => {
    // can't restore data but can create bare-bones table
    await queryInterface.createTable('ChainEntityMeta', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      ce_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      title: { type: Sequelize.STRING, allowNull: true },
      chain: { type: Sequelize.STRING, allowNull: false },
      author: { type: Sequelize.STRING, allowNull: true },
      type_id: { type: Sequelize.STRING, allowNull: true },
      project_chain: { type: Sequelize.STRING, allowNull: true },
    });
  },
};
