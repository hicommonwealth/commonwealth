'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'SnapshotProposals',
      {
        id: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        space: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        event: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        start: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        expire: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      },
      {
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ['id'] }],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.query('DROP TABLE "SnapshotProposals" IF EXISTS');
  },
};
