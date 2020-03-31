module.exports = (sequelize, DataTypes) => {
  const SupernovaLockdropBTCLock = sequelize.define('SupernovaLockdropBTCLock', {
    chainType: { type: DataTypes.STRING, allowNull: true },
    hash: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.STRING, allowNull: false },
    blocknum: { type: DataTypes.INTEGER, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: true },
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['address'] },
    ],
  });

  return SupernovaLockdropBTCLock;
};
