module.exports = (sequelize, DataTypes) => {
  const NotificationCategory = sequelize.define('NotificationCategory', {
    name: { type: DataTypes.STRING, primaryKey: true },
    description: { type: DataTypes.TEXT, allowNull: false },
  }, {
    underscored: true,
  });
  return NotificationCategory;
};
