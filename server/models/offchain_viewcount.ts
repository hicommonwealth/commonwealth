module.exports = (sequelize, DataTypes) => {
  const OffchainViewCount = sequelize.define('OffchainViewCount', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    chain: { type: DataTypes.STRING },
    community: { type: DataTypes.STRING },
    object_id: { type: DataTypes.INTEGER, allowNull: false },
    view_count: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    underscored: true,
    timestamps: false,
    indexes: [
      {fields: ['id']},
      {fields: ['chain', 'object_id']},
      {fields: ['community', 'object_id']},
      {fields: ['chain', 'community', 'object_id']},
      {fields: ['view_count']},
    ],
  });

  OffchainViewCount.associate = (models) => {
    models.OffchainViewCount.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainViewCount.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainViewCount.belongsTo(models.OffchainThread, { foreignKey: 'object_id', targetKey: 'id' });
  };

  return OffchainViewCount;
};
