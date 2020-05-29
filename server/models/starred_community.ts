module.exports = (sequelize, DataTypes) => {
  const StarredCommunity = sequelize.define('StarredCommunity', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    chain: { type: DataTypes.STRING, allowNull: true },
    community: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['chain'] },
      { fields: ['community'] },
    ],
  });

  StarredCommunity.associate = (models) => {
    models.StarredCommunity.belongsTo(models.User);
    models.StarredCommunity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.StarredCommunity.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
  };

  return StarredCommunity;
};
