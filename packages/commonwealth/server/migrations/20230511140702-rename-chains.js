'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Chains', 'Communities');

      const tables = await queryInterface.showAllTables();
      for (const table of tables) {
        const columns = await queryInterface.describeTable(table);
        const changeColumnName = Object.keys(columns).includes("chain") ? "chain" : 
        Object.keys(columns).includes("chain_id") ? "chain_id" : null;
        if(changeColumnName){
          console.log(table)
          await queryInterface.renameColumn(table, changeColumnName, "community_id",)
        }
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
