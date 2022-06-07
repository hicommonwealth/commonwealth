module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Projects',
        'description',
        { type: Sequelize.STRING },
        { transaction }
      );
      await queryInterface.addColumn(
        'Projects',
        'short_description',
        { type: Sequelize.STRING },
        { transaction }
      );
      await queryInterface.addColumn(
        'Projects',
        'cover_image',
        { type: Sequelize.STRING },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Projects', 'description', {
        transaction,
      });
      await queryInterface.addColumn('Projects', 'short_description', {
        transaction,
      });
      await queryInterface.addColumn('Projects', 'cover_image', {
        transaction,
      });
    });
  },
};
