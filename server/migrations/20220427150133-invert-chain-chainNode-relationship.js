module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Chains', 'ce_verbose', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.removeColumn('ChainNodes', 'ce_verbose');
    await queryInterface.addColumn(
      'Chains', 'address', {
        type: Sequelize.STRING,
        allowNull: true
    });
    await queryInterface.removeColumn('ChainNodes', 'address');
    await queryInterface.addColumn('Chains', 'token_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('ChainNodes', 'token_name');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ChainNodes', 'ce_verbose', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });

    await queryInterface.removeColumn('Chains', 'ce_verbose');
    await queryInterface.addColumn(
      'ChainNodes', 'address', {
        type: Sequelize.STRING,
        allowNull: true
    });
    await queryInterface.removeColumn('Chains', 'address');

    await queryInterface.addColumn('ChainNodes', 'token_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('Chains', 'token_name');
  }
};
