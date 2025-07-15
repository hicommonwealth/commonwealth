/* eslint-disable quotes */
/* eslint-disable no-restricted-syntax */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addresses = await queryInterface.sequelize.query(
      `SELECT * FROM "OffchainProfiles" JOIN "Addresses" ON "address_id"="id"`
    );
    await queryInterface.addColumn('Addresses', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await Promise.all(
      addresses[0].map(async (addr) => {
        const { address, id, data } = addr;
        const { name } = JSON.parse(data);
        const query = `UPDATE "Addresses" SET name='${name}' WHERE id='${id}'`;
        await queryInterface.sequelize.query(query);
      })
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Addresses', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
