'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('IpfsPins', 'user_id', {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('IpfsPins', 'user_id');
  },
};
