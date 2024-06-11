'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'ChainEntities',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          type: { type: Sequelize.STRING, allowNull: false },
          type_id: { type: Sequelize.STRING, allowNull: false },
          thread_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'OffchainThreads', key: 'id' },
          },
          completed: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction: t,
          timestamps: true,
          underscored: true,
          paranoid: false,
          indexes: [{ fields: ['id'] }, { fields: ['chain', 'event_name'] }],
        }
      );

      await queryInterface.addColumn(
        'ChainEvents',
        'entity_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ChainEntities',
            key: 'id',
          },
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainEvents', 'entity_id', {
        transaction: t,
      });
      await queryInterface.dropTable('ChainEntities', { transaction: t });
    });
  },
};
