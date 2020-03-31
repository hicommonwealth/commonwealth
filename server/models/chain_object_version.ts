module.exports = (sequelize, DataTypes) => {
  const ChainObjectVersion = sequelize.define('ChainObjectVersion', {
    id: { type: DataTypes.STRING, primaryKey: true },  // unique identifying string
    chain: { type: DataTypes.STRING, allowNull: false },

    // field on object representing a unique identifier
    unique_identifier: { type: DataTypes.STRING, allowNull: false },

    // field on object representing completion
    completion_field: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain'] },
    ],
  });

  ChainObjectVersion.associate = (models) => {
    models.ChainObjectVersion.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainObjectVersion.hasMany(models.ChainObject, { foreignKey: 'object_type' });
    models.ChainObjectVersion.hasMany(models.ChainObjectQuery,  { foreignKey: 'object_type' });
  };
  return ChainObjectVersion;
};
