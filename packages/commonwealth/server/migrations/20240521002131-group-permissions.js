'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'GroupPermissions',
      {
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Groups',
            key: 'id',
          },
          primaryKey: true,
        },
        type: {
          type: Sequelize.ENUM('CREATE_THREAD', 'CREATE_COMMENT'),
          allowNull: false,
          primaryKey: true,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        timestamps: true,
      },
    );
  },

  async down(queryInterface, _) {
    return queryInterface.dropTable('GroupPermissions');
  },
};
