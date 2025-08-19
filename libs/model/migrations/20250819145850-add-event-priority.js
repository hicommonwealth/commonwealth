'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Outbox',
        'priority',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX idx_outbox_unrelayed_priority_created_at
          ON public.outbox_unrelayed (priority DESC NULLS FIRST, created_at ASC);
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Outbox', 'priority', { transaction });
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS idx_outbox_unrelayed_priority_created_at;
      `,
        { transaction },
      );
    });
  },
};
