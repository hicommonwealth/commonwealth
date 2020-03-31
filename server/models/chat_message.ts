module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    chain: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    room: { type: DataTypes.STRING, allowNull: false },
  }, {
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['created_at'] },
    ],
  });

  return ChatMessage;
};
