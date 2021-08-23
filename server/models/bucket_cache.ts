import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';


export interface BucketCacheAttributes {
  name: string;
  ipns: string;
  ipfs: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BucketCacheInstance
  extends Model<BucketCacheAttributes>, BucketCacheAttributes {}

export type BucketCacheModelStatic = ModelStatic<BucketCacheInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): BucketCacheModelStatic => {
  const BucketCache = <BucketCacheModelStatic>sequelize.define<BucketCacheInstance, BucketCacheAttributes>(
    'BucketCache', {
      name: { type: dataTypes.STRING, primaryKey: true },
      ipns: { type: dataTypes.STRING, allowNull: false },
      ipfs: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: "BucketCache",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      paranoid: false,
    }
  );
  return BucketCache;
};
