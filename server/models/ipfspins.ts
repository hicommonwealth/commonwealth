import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type IpfsPinsAttributes = {
  id: number;
  IpfsHash: string;
  // created_at?: Date;
  // updated_at?: Date;
}

export type IpfsPinsInstance = ModelInstance<IpfsPinsAttributes>;

export type IpfsPinsModelStatic = ModelStatic<IpfsPinsInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): IpfsPinsModelStatic => {
  const IpfsPins = <IpfsPinsModelStatic>sequelize.define('IpfsPins', {
    id: { type: dataTypes.INTEGER, primaryKey: true },
    IpfsHash: { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'IpfsPins',
    underscored: true,
    // createdAt: 'created_at',
    // updatedAt: 'updated_at',
  });
  IpfsPins.associate = (models) => {
    models.IpfsPins.hasMany(models.Notification, {foreignKey: 'category_id'});
    models.IpfsPins.hasMany(models.Subscription, {foreignKey: 'category_id'})
  }
  return IpfsPins;
};

// module.exports = (sequelize, DataTypes) => {
//   class IpfsPins extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   IpfsPins.init({
//     id: DataTypes.INTEGER,
//     IpfsHash: DataTypes.STRING
//   }, {
//     sequelize,
//     modelName: 'IpfsPins',
//   });
//   return IpfsPins;
// };