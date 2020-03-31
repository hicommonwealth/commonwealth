module.exports = (sequelize, DataTypes) => {
  const OffchainProfile = sequelize.define('OffchainProfile', {
    address_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    data: { type: DataTypes.TEXT, allowNull: true },
  }, {
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['address_id'] },
    ],
  });

  OffchainProfile.associate = (models) => {
    models.OffchainProfile.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
  };

  return OffchainProfile;
};
