module.exports = (sequelize, DataTypes) => {
  const WaitlistRegistration = sequelize.define('WaitlistRegistration', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    chain_id: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: true },
  }, {
    timestamps: true,
    underscored: true,
  });
  return WaitlistRegistration;
};
