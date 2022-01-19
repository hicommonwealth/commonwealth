

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('DiscordTokenGating', {
        guild_id: {type: Sequelize.STRING, primaryKey: true},
        role_id: {type: Sequelize.STRING, primaryKey: true},
        chain_id: {type: Sequelize.STRING, allowNull: true, references: {model: 'Chains', key: 'id'}},
        token_id: {type: Sequelize.STRING, allowNull: true, references: {model: 'Tokens', key: 'id'}},
        min_tokens: {type: Sequelize.INTEGER, allowNull: false},
        max_tokens: {type: Sequelize.INTEGER, allowNull: true}
      }, {transaction: t})

      // ensures that chain_id and token_id cannot both be null
      await queryInterface.sequelize.query(`
      ALTER TABLE "DiscordTokenGating"
        ADD CONSTRAINT CK_one_is_valid
          CHECK (
              ("chain_id" IS NOT NULL AND "token_id" IS NULL)
              OR ("chain_id" IS NULL AND "token_id" IS NOT NULL)
              OR ("chain_id" IS NOT NULL AND "token_id" IS NOT NULL)
            );
    `, {type: 'RAW', raw: true, transaction: t})
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DiscordTokenGating');
  }
};
