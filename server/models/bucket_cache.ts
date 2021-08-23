import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';


export interface BucketCacheAttributes {
  name: string;
  ipns_cid: string;
  ipfs_cid: string;
  thread_link: string;
  ipns_link: string;
  bucket_website: string;
  encrypted: boolean;
  token?: string;
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
      ipns_cid: { type: dataTypes.STRING, allowNull: false },
      ipfs_cid: { type: dataTypes.STRING, allowNull: false },
      thread_link: { type: dataTypes.STRING, allowNull: false },
      ipns_link: { type: dataTypes.STRING, allowNull: false },
      bucket_website: { type: dataTypes.STRING, allowNull: false },
      encrypted: { type: dataTypes.BOOLEAN, allowNull: false},
      token: { type: dataTypes.STRING, allowNull: true },
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
