'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn('Chains', 'snapshot', 'snapshot_old', {
        transaction: t,
      });
      await queryInterface.addColumn(
        'Chains',
        'snapshot',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: false,
          defaultValue: [],
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET snapshot = array[snapshot_old] WHERE snapshot_old IS NOT NULL;`,
        { transaction: t }
      );
      await queryInterface.removeColumn('Chains', 'snapshot_old', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn('Chains', 'snapshot', 'snapshot_old', {
        transaction: t,
      });
      await queryInterface.addColumn(
        'Chains',
        'snapshot',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET snapshot = snapshot_old[1] WHERE cardinality(snapshot_old) > 0;`,
        { transaction: t }
      );
      await queryInterface.removeColumn('Chains', 'snapshot_old', {
        transaction: t,
      });
    });
  },
};
