module.exports = (sequelize, DataTypes) => {
  const InviteLink = sequelize.define('InviteLink', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    community_id: { type: DataTypes.STRING, allowNull: false },
    creator_id: { type: DataTypes.INTEGER, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    multi_use: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    time_limit: {
      type: DataTypes.ENUM,
      values: ['24h', '48h', '1w', '30d', 'none'],
      defaultValue: 'none',
      allowNull: false,
    },
  }, {
    underscored: true,
    indexes: [
      { fields: ['id'] },
    ],
  });

  InviteLink.associate = (models) => {
    models.InviteLink.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return InviteLink;
};
