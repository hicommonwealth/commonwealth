import { Model } from 'sequelize';
module.exports = (sequelize, DataTypes) => {
  class IpfsPins extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  IpfsPins.init({
    id: DataTypes.INTEGER,
    IpfsHash: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'IpfsPins',
  });
  return IpfsPins;
};