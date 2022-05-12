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
    await queryInterface.removeColumn('ChainNodes', 'chain');
    await queryInterface.sequelize.query(
      // eslint-disable-next-line max-len
      'DELETE FROM "ChainNodes" a WHERE a.id <> (SELECT min(b.id) FROM "ChainNodes" b WHERE  a.url = b.url)');

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
    await queryInterface.addColumn('ChainNodes', 'chain', {
      type: Sequelize.STRING,
    });
  }
};
