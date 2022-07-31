module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChainNodes', 'ce_verbose', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('ChainNodes', 'ce_verbose');
  },
};
