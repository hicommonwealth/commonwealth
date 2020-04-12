module.exports = (sequelize, DataTypes) => {
  const OffchainTag = sequelize.define('OffchainTag', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    community_id: { type: DataTypes.STRING, allowNull: true },
    chain_id: { type: DataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
  });

  OffchainTag.associate = (models) => {
    models.OffchainTag.belongsTo(models.OffchainCommunity, {
      as: 'community',
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.OffchainTag.belongsTo(models.Chain, {
      as: 'chain',
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.OffchainTag.belongsToMany(models.OffchainThread, {
      through: models.TaggedThread,
      as: 'threads',
      foreignKey: 'tag_id',
      otherKey: 'thread_id',
    });
  };

  return OffchainTag;
};
