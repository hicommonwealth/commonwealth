'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'tempEmailVerified', {
      type: Sequelize.BOOLEAN,
    });
    await queryInterface.sequelize.query(
      `UPDATE \"Users\" SET "tempEmailVerified"=true WHERE "emailVerified" IS NOT NULL`
    );
    await queryInterface.removeColumn('Users', 'emailVerified');
    await queryInterface.renameColumn(
      'Users',
      'tempEmailVerified',
      'emailVerified'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'emailVerified');
    await queryInterface.addColumn('Users', 'emailVerified', {
      type: Sequelize.DATE,
    });
  },
};
