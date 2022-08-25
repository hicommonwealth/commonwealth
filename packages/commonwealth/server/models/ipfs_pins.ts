import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type IpfsPinsAttributes = {
  id: number;
  address_id: number;
  user_id: number;
  ipfs_hash: string;
  created_at?: Date;
  updated_at?: Date;
};

export type IpfsPinsInstance = ModelInstance<IpfsPinsAttributes>;

export type IpfsPinsModelStatic = ModelStatic<IpfsPinsInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): IpfsPinsModelStatic => {
  const IpfsPins = <IpfsPinsModelStatic>sequelize.define(
    'IpfsPins',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      ipfs_hash: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'IpfsPins',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  IpfsPins.associate = (models) => {
    models.IpfsPins.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };
  IpfsPins.associate = (models) => {
    models.IpfsPins.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
  };
  return IpfsPins;
};
