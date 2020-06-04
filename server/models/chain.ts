module.exports = (sequelize, DataTypes) => {
  const Chain = sequelize.define('Chain', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    featured_tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    symbol: { type: DataTypes.STRING, allowNull: false },
    network: { type: DataTypes.STRING, allowNull: false },
    icon_url: { type: DataTypes.STRING },
    active: { type: DataTypes.BOOLEAN },
    type: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
  });

  Chain.associate = (models) => {
    models.Chain.hasMany(models.ChainNode, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'chain_id', targetKey: 'id', });
    models.Chain.hasMany(models.OffchainThread, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.OffchainComment, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.StarredCommunity, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.belongsToMany(models.User, { through: models.WaitlistRegistration });

    // currently we have a 1-to-1 mapping from chain <--> chain_object_version
    // in the future, we may want this to be a many-to-1, in case a chain has
    // many versions of chain objects. however, for now, the client only supports 1.
    models.Chain.hasOne(models.ChainObjectVersion, {
      foreignKey: 'chain',
    });
  };

  return Chain;
};
