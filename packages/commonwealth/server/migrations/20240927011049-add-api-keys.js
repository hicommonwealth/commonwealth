'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('ApiKeys', {
        user_id: {
          primaryKey: true,
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        hashed_api_key: { type: Sequelize.STRING, allowNull: false },
        salt: { type: Sequelize.STRING, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ApiKeys');
  },
};
