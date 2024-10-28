'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Tokens', { transaction: t });
      await queryInterface.changeColumn(
        'Communities',
        'namespace',
        {
          type: Sequelize.STRING, // up to 78 digits with no decimal places
          allowNull: true,
          unique: true,
        },
        { transaction: t },
      );
      await queryInterface.createTable(
        'Tokens',
        {
          // derived from event
          token_address: { type: Sequelize.STRING, primaryKey: true },
          namespace: {
            type: Sequelize.STRING,
            references: {
              model: 'Communities',
              key: 'namespace',
            },
          },
          name: { type: Sequelize.STRING },
          symbol: { type: Sequelize.STRING },
          initial_supply: { type: Sequelize.DECIMAL(78, 0) },

          // platform related
          description: { type: Sequelize.STRING, allowNull: true },
          icon_url: { type: Sequelize.STRING, allowNull: true },
          is_locked: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
