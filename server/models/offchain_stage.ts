import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainStageAttributes {
  name: string;
  featured_in_sidebar: boolean;
  featured_in_new_post: boolean;
  id?: number;
  chain_id?: string;
  community_id?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  default_offchain_template?: string;

  // associations
  community?: OffchainCommunityAttributes;
  chain?: ChainAttributes;
  threads?: OffchainThreadAttributes[] | OffchainStageAttributes['id'][];
}

export interface OffchainStageInstance extends Model<OffchainStageAttributes>, OffchainStageAttributes {
  // no mixins used
  // TODO: do we need to implement the "as" stuff here?
}

export type OffchainStageModelStatic = ModelStatic<OffchainStageInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainStageModelStatic => {
  const OffchainStage = <OffchainStageModelStatic>sequelize.define('OffchainStage', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    community_id: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
    featured_in_sidebar: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    featured_in_new_post: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    default_offchain_template: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    tableName: 'OffchainStages',
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: [ 'created_at', 'updated_at', 'deleted_at' ],
      }
    },
  });

  OffchainStage.associate = (models) => {
    models.OffchainStage.belongsTo(models.OffchainCommunity, {
      as: 'community',
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.OffchainStage.belongsTo(models.Chain, {
      as: 'chain',
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.OffchainStage.hasMany(models.OffchainThread, {
      as: 'threads',
      foreignKey: 'stage_id',
    });
  };

  return OffchainStage;
};
