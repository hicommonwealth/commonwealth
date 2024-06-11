'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // create the new table
      await queryInterface.createTable(
        'SsoTokens',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          issued_at: { type: Sequelize.INTEGER, allowNull: true },
          issuer: { type: Sequelize.STRING, allowNull: true },
          address_id: { type: Sequelize.INTEGER, allowNull: true },
          state_id: { type: Sequelize.STRING, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      // add indexes
      await queryInterface.addIndex('SsoTokens', ['id'], { transaction: t });
      await queryInterface.addIndex('SsoTokens', ['issuer', 'address_id'], {
        transaction: t,
      });

      // migrate existing user data
      await queryInterface.sequelize.query(
        `
        INSERT INTO "SsoTokens" (address_id, issuer, issued_at, created_at, updated_at)
        SELECT sso.address_id, sso.issuer, sso.issued_at, NOW(), NOW()
        FROM 
          (SELECT a.user_id, a."chain",
            DENSE_RANK() OVER (PARTITION BY a.user_id ORDER BY CASE a."chain" WHEN 'ethereum' THEN 1 WHEN 'edgeware' THEN 5 ELSE 9 END) AS pref,
            a.id AS address_id, u."magicIssuer"AS issuer, u."lastMagicLoginAt" AS issued_at
          FROM "Addresses" a 
            INNER JOIN "Users" u ON a.user_id = u.id 
          WHERE a.is_magic = TRUE 
          ) sso
        WHERE sso.pref = 1;
      `,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // remove user data columns
      await queryInterface.removeColumn('Users', 'magicIssuer', {
        transaction: t,
      });
      await queryInterface.removeColumn('Users', 'lastMagicLoginAt', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // restore User columns
      await queryInterface.addColumn(
        'Users',
        'magicIssuer',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Users',
        'lastMagicLoginAt',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );

      // migrate data from SsoTokens
      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET "magicIssuer" = s.issuer, 
          "lastMagicLoginAt" = s.issued_at
        FROM "SsoTokens" s
          INNER JOIN "Addresses" a ON s.address_id = a.id 
        WHERE a.user_id = "Users".id;
      `,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // drop SsoTokens table
      await queryInterface.dropTable('SsoTokens', { transaction: t });
    });
  },
};
