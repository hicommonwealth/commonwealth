'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `UPDATE "Comments" SET object_id = REPLACE(object_id, '-', '_');`
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `UPDATE "Comments" SET object_id = REPLACE(object_id, '_', '-');`
    );
  },
};
