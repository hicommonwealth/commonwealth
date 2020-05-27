module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING },
    emailVerified: { type: DataTypes.DATE, allowNull: true },
    emailNotificationInterval: { type: DataTypes.ENUM, allowNull: true, defaultValue: null },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastVisited: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    selectedAddresses: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    disableRichText: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['email'] },
    ],
  });

  User.associate = (models) => {
    models.User.belongsTo(models.ChainNode, { as: 'selectedNode', constraints: false });
    models.User.hasMany(models.Address);
    models.User.hasMany(models.SocialAccount);
    models.User.hasMany(models.Membership);
    models.User.belongsToMany(models.Chain, { through: models.WaitlistRegistration });
  };

  return User;
};
