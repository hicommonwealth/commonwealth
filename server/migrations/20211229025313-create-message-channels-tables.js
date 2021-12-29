

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('Chat_Channels', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        community_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Chain', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction: t, underscored: true });
      await queryInterface.createTable('Chat_Messages', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        message: { type: Sequelize.TEXT, allowNull: false },
        chat_channel_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ChatChannel', key: 'id' }},
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Chat_Channels', { transaction: t });
      await queryInterface.dropTable('Chat_Messages', { transaction: t });
    });
  }
};
