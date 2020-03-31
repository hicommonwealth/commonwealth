module.exports = (sequelize, DataTypes) => {
  const ChainNode = sequelize.define('ChainNode', {
    chain: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['chain'] },
    ],
  });

  ChainNode.associate = (models) => {
    models.ChainNode.belongsTo(models.Chain, { foreignKey: 'chain' });
  };

  return ChainNode;
};
