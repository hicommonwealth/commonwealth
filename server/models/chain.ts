module.exports = (sequelize, DataTypes) => {
  const Chain = sequelize.define('Chain', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    symbol: { type: DataTypes.STRING, allowNull: false },
    network: { type: DataTypes.STRING, allowNull: false },
    icon_url: { type: DataTypes.STRING },
    active: { type: DataTypes.BOOLEAN },
  }, {
    timestamps: false,
    underscored: true,
  });

  Chain.associate = (models) => {
    models.Chain.hasMany(models.ChainNode, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.Membership, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'chain_id', targetKey: 'id', });
    models.Chain.hasMany(models.OffchainThread, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.hasMany(models.OffchainComment, { foreignKey: 'chain', targetKey: 'id' });
    models.Chain.belongsToMany(models.User, { through: models.WaitlistRegistration });
  };

  return Chain;
};
