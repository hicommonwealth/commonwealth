module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chains', 'featured_topics');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chains', 'featured_topics', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
  },
};
