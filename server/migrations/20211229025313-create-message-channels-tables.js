

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('ChatMessages', 'OldChatMessages', { transaction: t });

      await queryInterface.createTable('ChatChannels', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        community_id: { type: Sequelize.STRING, allowNull: false, references: { model: 'Chains', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction: t });

      // creates a composite unique constraint on name and community. This ensures that a community cannot have any chat
      // channels with the same name
      await queryInterface.addConstraint("ChatChannels", {
        type: 'unique',
        fields: ['name', 'community_id'],
        name: 'chat_channel_unique_composite_constraint'
      });

      await queryInterface.sequelize.query(`
        CREATE TABLE "ChatMessages" (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            chat_channel_id INTEGER NOT NULL REFERENCES "ChatChannels" ON DELETE CASCADE,
            created_at DATE NOT NULL,
            updated_at DATE NOT NULL
        );
      `, { type: 'RAW', raw: true, transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('ChatChannels', { transaction: t });
      await queryInterface.dropTable('ChatMessages', { transaction: t });
      await queryInterface.renameTable("OldChatMessages", "ChatMessages", { transaction: t });
    });
  }
};
