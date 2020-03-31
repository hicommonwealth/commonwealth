module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    chain: { type: DataTypes.STRING, allowNull: true },
    community: { type: DataTypes.STRING, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
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

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.User);
    models.Membership.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Membership.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
  };

  return Membership;
};
