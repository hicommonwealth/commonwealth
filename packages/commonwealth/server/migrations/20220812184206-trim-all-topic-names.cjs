module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.query(
      `UPDATE "Topics" SET name=LTRIM(RTRIM(name));`
    );
  },

  down: async (queryInterface, Sequelize) => {
    return true;
  },
};
