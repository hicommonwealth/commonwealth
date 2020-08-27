/* eslint-disable quotes */
'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const users = await queryInterface.sequelize.query(``)

    });
  },

  down: (queryInterface, DataTypes) => {
    return Promise.all([]);
  }
};
