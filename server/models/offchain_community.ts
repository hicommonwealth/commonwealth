module.exports = (sequelize, DataTypes) => {
  const OffchainCommunity = sequelize.define('OffchainCommunity', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    creator_id: { type: DataTypes.INTEGER, allowNull: false },
    default_chain: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // auth_forum: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // auth_condition: { type: DataTypes.STRING, allowNull: true, defaultValue: null }, // For Auth Forum Checking
    // ^^^ other names: community_config, OffchainCommunityConfiguration, CommunityConditions
    privacyEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    invitesEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['creator_id'] },
    ],
  });

  OffchainCommunity.associate = (models) => {
    models.OffchainCommunity.belongsTo(models.Chain, { foreignKey: 'default_chain', targetKey: 'id', });
    models.OffchainCommunity.belongsTo(models.Address, { foreignKey: 'creator_id', targetKey: 'id', });
    models.OffchainCommunity.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'community_id', targetKey: 'id', });
    models.OffchainCommunity.hasMany(models.OffchainThread, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainCommunity.hasMany(models.Membership, { foreignKey: 'chain', targetKey: 'id' });
  };

  return OffchainCommunity;
};
