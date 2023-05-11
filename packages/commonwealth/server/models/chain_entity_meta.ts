import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes } from './communities';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';

export type ChainEntityMetaAttributes = {
  id: number; // sequelize auto-generated primary key id --- NEVER USE DIRECTLY
  // this is the primary key id from the chain-events service
  // (used to match chain-entity-meta with chain-entities from chain-events)
  ce_id: number;
  title?: string;
  chain: string;
  author?: string;
  thread_id?: number;
  type_id?: string;
  project_chain?: string;

  Chain?: CommunityAttributes;
  ProjectChain?: CommunityAttributes;
  Thread?: ThreadAttributes;
};

export type ChainEntityMetaInstance = ModelInstance<ChainEntityMetaAttributes>;

export type ChainEntityMetaModelStatic = ModelStatic<ChainEntityMetaInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEntityMetaModelStatic => {
  const ChainEntityMeta = <ChainEntityMetaModelStatic>sequelize.define<
    ChainEntityMetaInstance,
    ChainEntityMetaAttributes
  >(
    'ChainEntityMeta',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ce_id: { type: dataTypes.INTEGER, allowNull: false, unique: true },
      title: { type: dataTypes.STRING, allowNull: true },
      chain: { type: dataTypes.STRING, allowNull: false, field: 'community_id'},
      author: { type: dataTypes.STRING, allowNull: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: true },
      type_id: { type: dataTypes.STRING, allowNull: true },
      project_chain: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ChainEntityMeta',
      timestamps: false,
      underscored: true,
      paranoid: false,
      indexes: [{ fields: ['id'] }],
    }
  );

  ChainEntityMeta.associate = (models) => {
    models.ChainEntityMeta.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.ChainEntityMeta.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
    models.ChainEntityMeta.belongsTo(models.Community, {
      foreignKey: 'project_chain',
      targetKey: 'id',
      as: 'ProjectChain',
    });
  };

  return ChainEntityMeta;
};
