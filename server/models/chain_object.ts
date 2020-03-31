module.exports = (sequelize, DataTypes) => {
  const ChainObject = sequelize.define('ChainObject', {
    id: { type: DataTypes.STRING, primaryKey: true }, // type + id
    object_type: { type: DataTypes.STRING, allowNull: false },
    object_id: { type: DataTypes.STRING, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false },

    // JSONB is a fancy postgres type that stores json in binary fmt
    object_data: { type: DataTypes.JSONB, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['object_type', 'object_id'] },
    ],
  });

  ChainObject.associate = (models) => {
    models.ChainObject.belongsTo(models.ChainObjectVersion, { foreignKey: 'object_type', targetKey: 'id' });
  };

  return ChainObject;
};
