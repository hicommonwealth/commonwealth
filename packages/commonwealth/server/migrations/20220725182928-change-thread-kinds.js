module.exports = {
  up: async (queryInterface) => {
    const query = `UPDATE "Threads" SET kind='discussion' WHERE kind='forum';`;
    return queryInterface.sequelize.query(query);
  },

  down: async (queryInterface) => {
    const query = `UPDATE "Threads" SET kind='forum' WHERE kind='discussion';`;
    return queryInterface.sequelize.query(query);
  },
};
