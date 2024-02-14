'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'temp_stages_enabled',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_stages_enabled = CASE
            WHEN stages_enabled = 'true' THEN TRUE
            ELSE FALSE
        END;
      `,
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('Communities', 'stages_enabled', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Communities',
        'temp_stages_enabled',
        'stages_enabled',
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {});
  },
};
