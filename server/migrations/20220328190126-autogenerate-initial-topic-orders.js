module.exports = {
  up: async (queryInterface, Sequelize) => {
    const query = `
      UPDATE T1
      SET T1.order = T2.order
      FROM 'OffchainTopics' T1
      JOIN (
        SELECT 
        DENSE_RANK() OVER (ORDER BY name)
        AS 'order', Name
        FROM 'OffchainTopics'
        WHERE chain = ${chain}
      ) T2
      ON T1.Name = T2.Name
      WHERE chain = ${chain}`;
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
