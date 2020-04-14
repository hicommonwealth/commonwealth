module.exports = (sequelize, DataTypes) => {
  const ChainEvent = sequelize.define('ChainEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain_event_type_id: { type: DataTypes.STRING, allowNull: false },
    block_number: { type: DataTypes.INTEGER, allowNull: false },

    // we could store this as a raw data blob too if necessary
    event_data: { type: DataTypes.JSONB, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['block_number', 'chain_event_type_id'] },
    ]
  });

  ChainEvent.associate = (models) => {
    // master event type
    models.ChainEvent.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
  };

  return ChainEvent;
};
