'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('OffchainCommunities', 'terms', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.addColumn('Chains', 'terms', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: true,
      }, { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainCommunities', 'terms', { transaction: t });
      await queryInterface.removeColumn('Chains', 'terms', { transaction: t });
    });
  }
};

'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
