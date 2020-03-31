module.exports = (sequelize, DataTypes) => {
  const InviteCode = sequelize.define('InviteCode', {
    id: { type: DataTypes.STRING, primaryKey: true },
    community_id: { type: DataTypes.STRING, allowNull: false },
    community_name: { type: DataTypes.STRING, allowNull: true },
    creator_id: { type: DataTypes.INTEGER, allowNull: false },
    invited_email: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['creator_id'] },
    ],
  });

  InviteCode.associate = (models) => {
    models.InviteCode.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return InviteCode;
};
