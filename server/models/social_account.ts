module.exports = (sequelize, DataTypes) => {
  const SocialAccount = sequelize.define('SocialAccount', {
    provider: { type: DataTypes.STRING },
    provider_username: { type: DataTypes.STRING },
    provider_userid: { type: DataTypes.STRING },
    access_token: { type: DataTypes.STRING },
    refresh_token: { type: DataTypes.STRING },
  }, {
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'provider'] },
    ],
  });

  SocialAccount.associate = (models) => {
    models.SocialAccount.belongsTo(models.User);
  };

  return SocialAccount;
};
