module.exports = (sequelize, DataTypes) => {
  const HedgehogUser = sequelize.define('HedgehogUser', {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    username:      { type: DataTypes.STRING, allowNull: false, unique: true },
    walletAddress: { type: DataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
  });

  return HedgehogUser;
};
