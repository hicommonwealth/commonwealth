module.exports = (sequelize, DataTypes) => {
  const ChainEntity = sequelize.define('ChainEntity', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    type_id: { type: DataTypes.STRING, allowNull: false },
    thread_id: { type: DataTypes.INTEGER, allowNull: true },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'type', 'id' ] },
    ],
  });

  ChainEntity.associate = (models) => {
    models.ChainEntity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainEntity.belongsTo(models.OffchainThread, { foreignKey: 'thread_id', targetKey: 'id' });
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };
};
