'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'OffchainReaction',
      'author_chain',
      {
      type: DataTypes.STRING,
      allowNull: true,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'OffchainReaction',
      'author_chain',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  }
};
