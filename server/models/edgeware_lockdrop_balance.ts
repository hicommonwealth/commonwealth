module.exports = (sequelize, DataTypes) => {
  const EdgewareLockdropBalance = sequelize.define('EdgewareLockdropBalance', {
    address: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.STRING, allowNull: false },
    blocknum: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['address'] },
    ],
  });

  return EdgewareLockdropBalance;
};
