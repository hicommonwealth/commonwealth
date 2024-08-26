'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Addresses',
        'is_banned',
        Sequelize.BOOLEAN,
        { transaction, allowNull: false, defaultValue: false },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" AS a
        SET is_banned = true
        FROM "Bans" b
        WHERE a.address = b.address AND a.community_id = b.community_id;
       `,
        {
          transaction,
        },
      );
      await queryInterface.dropTable('Bans', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'Bans',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          address: { type: Sequelize.STRING, allowNull: false },
          community_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Communities', key: 'id' },
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          underscored: true,
          indexes: [{ fields: ['community_id'] }],
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        INSERT INTO "Bans" (address, community_id, created_at, updated_at)
        SELECT address, community_id, NOW(), NOW()
        FROM "Addresses"
        WHERE is_banned = true;
       `,
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('Addresses', 'is_banned', {
        transaction,
      });
    });
  },
};
