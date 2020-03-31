'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query(`UPDATE "Comments" SET object_id = REPLACE(object_id, '-', '_');`);
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query(`UPDATE "Comments" SET object_id = REPLACE(object_id, '_', '-');`);
  }
};
