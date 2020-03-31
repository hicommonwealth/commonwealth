module.exports = (sequelize, DataTypes) => {
  const ContractCategory = sequelize.define('ContractCategory', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    name:        { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    color:       { type: DataTypes.STRING, allowNull: false },
  }, {
    underscored: true,
  });

  return ContractCategory;
};
