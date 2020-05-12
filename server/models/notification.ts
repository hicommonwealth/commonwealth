module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    subscription_id: { type: DataTypes.INTEGER, allowNull: false },
    notification_data: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain_event_id: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['subscription_id'] },
    ]
  });

  Notification.associate = (models) => {
    models.Notification.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
    models.Notification.belongsTo(models.ChainEvent, { foreignKey: 'chain_event_id', targetKey: 'id' });
  };

  return Notification;
};
