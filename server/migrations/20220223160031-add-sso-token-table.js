'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // create the new table
      await queryInterface.createTable('SsoTokens', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        issued_at: { type: Sequelize.INTEGER, allowNull: false },
        issuer: { type: Sequelize.STRING, allowNull: false },
        address_id: { type: Sequelize.INTEGER, allowNull: false },
        state_id: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // add indexes
      await queryInterface.addIndex('SsoTokens', ['id'], { transaction: t });
      await queryInterface.addIndex('SsoTokens', ['issuer', 'address_id'], { transaction: t });

      // migrate existing user data
      // TODO: fetch all Addresses with "is_magic = true", and query their users
      //   and create SsoTokens for them using  address_id, issuer, issued_at

      // remove user data columns
      await queryInterface.removeColumn('Users', 'magicIssuer', { transaction: t });
      await queryInterface.removeColumn('Users', 'lastMagicLoginAt', { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // restore User columns
      await queryInterface.addColumn('Users', 'magicIssuer', { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addColumn('Users', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t });

      // migrate data from SsoTokens
      // TODO: query all SsoTokens attached to addresses where "is_magic = true", and re-add issuer/issued_at to their associated User

      // drop SsoTokens table
      await queryInterface.dropTable('SsoTokens', { transaction: t });
    });
  }
};
