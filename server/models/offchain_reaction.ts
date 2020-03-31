module.exports = (sequelize, DataTypes) => {
  const OffchainReaction = sequelize.define('OffchainReaction', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: DataTypes.STRING, allowNull: true },
    object_id: { type: DataTypes.STRING, allowNull: false },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    reaction: { type: DataTypes.STRING, allowNull: false },
    community: { type: DataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'object_id'] },
      { fields: ['address_id'] },
      { fields: ['chain', 'address_id', 'object_id', 'reaction'], unique: true },
    ],
  });

  OffchainReaction.associate = (models) => {
    models.OffchainReaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.Address);
  };

  return OffchainReaction;
};
