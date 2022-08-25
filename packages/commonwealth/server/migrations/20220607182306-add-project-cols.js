module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Projects',
        'title',
        { type: Sequelize.STRING(64) },
        { transaction }
      );
      await queryInterface.addColumn(
        'Projects',
        'description',
        { type: Sequelize.TEXT },
        { transaction }
      );
      await queryInterface.addColumn(
        'Projects',
        'short_description',
        { type: Sequelize.STRING(224) },
        { transaction }
      );
      await queryInterface.addColumn(
        'Projects',
        'cover_image',
        { type: Sequelize.TEXT },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Projects', 'title', {
        transaction,
      });
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
