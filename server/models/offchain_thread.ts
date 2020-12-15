import * as Sequelize from 'sequelize';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainTopicAttributes } from './offchain_topic';
import { OffchainAttachmentAttributes } from './offchain_attachment';

export interface OffchainThreadAttributes {
  id?: number;
  address_id: number;
  title: string;
  body?: string;
  plaintext?: string;
  kind: string;
  url?: string;
  topic_id?: number;
  pinned?: boolean;
  chain?: string;
  community?: string;

  read_only?: boolean;
  version_history?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Address?: AddressAttributes;
  OffchainAttachments?: OffchainAttachmentAttributes[] | OffchainAttachmentAttributes['id'][];
}

export interface OffchainThreadInstance extends Sequelize.Instance<OffchainThreadAttributes>, OffchainThreadAttributes {
  // no mixins used
}

export interface OffchainThreadModel extends Sequelize.Model<OffchainThreadInstance, OffchainThreadAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainThreadModel => {
  const OffchainThread = sequelize.define<OffchainThreadInstance, OffchainThreadAttributes>('OffchainThread', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    title: { type: dataTypes.TEXT, allowNull: false },
    body: { type: dataTypes.TEXT, allowNull: true },
    plaintext: { type: dataTypes.TEXT, allowNull: true },
    kind: { type: dataTypes.TEXT, allowNull: false },
    url: { type: dataTypes.TEXT, allowNull: true },
    topic_id: { type: dataTypes.INTEGER, allowNull: true },
    pinned: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    read_only: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['address_id'] },
    ],
  });

  OffchainThread.associate = (models) => {
    models.OffchainThread.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainThread.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainThread.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.OffchainThread.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
    models.OffchainThread.belongsTo(models.OffchainTopic, {
      as: 'topic',
      foreignKey: 'topic_id',
    });
    models.OffchainThread.belongsToMany(models.Role, {
      through: 'read_only_roles_threads',
      as: 'read_only_roles',
      foreignKey: 'thread_id',
      otherKey: 'id',
    });
  };

  return OffchainThread;
};
