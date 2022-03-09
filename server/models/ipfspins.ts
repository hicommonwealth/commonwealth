import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type IpfsPinsAttributes = {
  id: number;
  address_id: number;
  ipfs_hash: string;
  created_at: Date;
  updated_at: Date;
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
      ipfs_hash: { type: dataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'IpfsPins',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return IpfsPins;
};
