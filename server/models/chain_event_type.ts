module.exports = (sequelize, DataTypes) => {
  const ChainEventType = sequelize.define('ChainEventType', {
    // id = chain-event_name (event_name is value of string enum)
    id: { type: DataTypes.STRING, primaryKey: true },
    chain: { type: DataTypes.STRING, allowNull: false },
    event_name: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'event_name'] },
    ]
  });

  ChainEventType.associate = (models) => {
    // chain the event happens on
    models.ChainEventType.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });

    // many emitted events of this type
    models.ChainEventType.hasMany(models.ChainEvent, { as: 'events' });

    // many users subscribed to this event type
    // TODO: this is currently unused, but could be useful?
    // models.ChainEventType.hasMany(models.Subscription, { as: 'subscriptions' });
  };

  return ChainEventType;
};
