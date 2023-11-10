'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Memberships', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    });
    await queryInterface.addIndex('Memberships', {
      fields: ['address_id', 'group_id'],
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Memberships', ['address_id', 'group_id']);
    await queryInterface.removeColumn('Memberships', 'id');
  },
};
