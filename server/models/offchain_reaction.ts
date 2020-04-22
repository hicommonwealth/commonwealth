module.exports = (sequelize, DataTypes) => {
  const OffchainReaction = sequelize.define('OffchainReaction', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: DataTypes.STRING, allowNull: true },
    thread_id: { type: DataTypes.INTEGER, allowNull: true },
    comment_id: { type: DataTypes.INTEGER, allowNull: true },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    reaction: { type: DataTypes.STRING, allowNull: false },
    community: { type: DataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'thread_id', 'comment_id'] },
      { fields: ['address_id'] },
      { fields: ['chain', 'address_id', 'thread_id', 'comment_id', 'reaction'], unique: true },
    ],
  });

  OffchainReaction.associate = (models) => {
    models.OffchainReaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainComment, { foreignKey: 'comment_id', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainThread, { foreignKey: 'thread_id', targetKey: 'id' });
  };

  return OffchainReaction;
};
