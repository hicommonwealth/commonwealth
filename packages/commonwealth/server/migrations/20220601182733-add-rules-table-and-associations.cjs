module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'Rules',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'Chains',
              key: 'id',
            },
          },
          rule: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'Topics',
        'rule_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Rules',
            key: 'id',
          },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'ChatChannels',
        'rule_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Rules',
            key: 'id',
          },
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('OffchainTopics', 'rule_id', {
        transaction,
      });
      await queryInterface.removeColumn('ChatChannels', 'rule_id', {
        transaction,
      });
      await queryInterface.dropTable('Rules', { transaction });
    });
  },
};
