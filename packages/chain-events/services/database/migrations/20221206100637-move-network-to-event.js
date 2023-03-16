'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainEvents',
        'network',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
            UPDATE "ChainEvents" CE
            SET network = CET.event_network
            FROM "ChainEventTypes" CET
            WHERE CE.chain_event_type_id = CET.id;
    `,
        { transaction: t }
      );

      await queryInterface.changeColumn(
        'ChainEvents',
        'network',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ChainEvents', 'network');
  },
};
