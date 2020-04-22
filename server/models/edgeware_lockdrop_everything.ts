module.exports = (sequelize, DataTypes) => {
  const EdgewareLockdropEverything = sequelize.define('EdgewareLockdropEverything', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: true },
  }, {
    underscored: true,
    timestamps: true,
  });

  return EdgewareLockdropEverything;
};
