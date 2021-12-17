'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // const query =
    // `
    //   ALTER TABLE "Chains" RENAME COLUMN snapshot TO snapshot_old;
    //   ALTER TABLE "Chains" ADD COLUMN snapshot varchar(255)[] DEFAULT '{}';
    //   UPDATE "Chains" SET snapshot = array[snapshot_old] WHERE snapshot_old IS NOT NULL;
    //   ALTER TABLE "Chains" DROP COLUMN "snapshot_old";
    // `

    return queryInterface.sequelize.transaction(async (t) => {


    // an example of the rename query at top.
    await queryInterface.renameColumn('Chains', 'snapshot', 'snapshot_old', { transaction: t });

    // an example of the addColumn query
    // await queryInterface.addColumn('Chains', 'snapshot', {
    //   type: dataTypes.ARRAY(dataTypes.STRING),
    // }, { transaction: t });

        const query =
    `
      ALTER TABLE "Chains" ADD COLUMN snapshot varchar(255)[] DEFAULT '{}';
      UPDATE "Chains" SET snapshot = array[snapshot_old] WHERE snapshot_old IS NOT NULL;
      ALTER TABLE "Chains" DROP COLUMN "snapshot_old";
    `

    await queryInterface.sequelize.query(query, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

     const query = 
     `
      ALTER TABLE "Chains" RENAME COLUMN snapshot TO snapshot_old;
      ALTER TABLE "Chains" ADD COLUMN snapshot varchar(255);
      UPDATE "Chains" SET snapshot = snapshot_old[1] WHERE cardinality(snapshot_old) > 0;
      ALTER TABLE "Chains" DROP COLUMN "snapshot_old";
     `
 
     return queryInterface.sequelize.query(query);
  }
};
