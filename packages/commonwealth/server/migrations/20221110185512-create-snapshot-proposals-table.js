'use strict';

module.exports = {
 up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('SnapshotProposals', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      space : {
        type: Sequelize.STRING,
        allowNull: false,
      },
      event: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expire :{
        type: Sequelize.TIMESTAMP,
      }
    }, {
      underscored: true,
      indexes: [
        { fields: ['id'] },
      ],
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SnapshotProposals');
  }
};
