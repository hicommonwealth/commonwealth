module.exports = (sequelize, DataTypes) => {
  const EdgewareLockdropEvent = sequelize.define('EdgewareLockdropEvent', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    origin: { type: DataTypes.STRING, allowNull: false },
    blocknum: { type: DataTypes.INTEGER, allowNull: false },
    timestamp: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: true },
  }, {
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['origin', 'blocknum'] },
      { fields: ['origin', 'timestamp'] },
    ],
  });

  return EdgewareLockdropEvent;
};
