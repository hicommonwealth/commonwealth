module.exports = (sequelize, DataTypes) => {
  const HedgehogAuthentication = sequelize.define('HedgehogAuthentication', {
    iv:         { type: DataTypes.STRING, allowNull: false },
    cipherText: { type: DataTypes.STRING, allowNull: false },
    lookupKey:  { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
  }, {
    underscored: true
  });

  return HedgehogAuthentication;
};
