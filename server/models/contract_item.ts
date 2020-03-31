module.exports = (sequelize, DataTypes) => {
  const ContractItem = sequelize.define('ContractItem', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    chain:       { type: DataTypes.STRING, allowNull: false },
    name:        { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    color:       { type: DataTypes.STRING, allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    underscored: true,
  });

  ContractItem.associate = (models) => {
    models.ContractItem.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ContractItem.belongsTo(models.ContractCategory, { foreignKey: 'category_id', targetKey: 'id' });
  };
  return ContractItem;
};
