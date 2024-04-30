'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Addresses', 'keytype', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    const toDelete = await queryInterface.sequelize.query(
      `SELECT id FROM "Addresses" WHERE keytype IS NOT NULL`
    );
    const ids = toDelete ? toDelete[0].map(({ id }) => id) : [];
    return queryInterface.sequelize
      .transaction(async (t) => {
        await queryInterface.bulkDelete(
          'OffchainProfiles',
          { address_id: ids },
          { transaction: t }
        );
        await queryInterface.bulkDelete(
          'Addresses',
          { id: ids },
          { transaction: t }
        );
      })
      .then(() => {
        return queryInterface.removeColumn('Addresses', 'keytype');
      });
  },
};
