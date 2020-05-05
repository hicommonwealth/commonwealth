import * as Sequelize from 'sequelize';

import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainTagAttributes {
  id?: number;
  name: string;
  description?: string;
  community_id: string;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  community?: OffchainCommunityAttributes;
  chain?: ChainAttributes;
  threads?: OffchainThreadAttributes[] | OffchainTagAttributes['id'][];
}

export interface OffchainTagInstance extends Sequelize.Instance<OffchainTagAttributes>, OffchainTagAttributes {
  // no mixins used
  // TODO: do we need to implement the "as" stuff here?
}

export interface OffchainTagModel extends Sequelize.Model<OffchainTagInstance, OffchainTagAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainTagModel => {
  const OffchainTag = sequelize.define<OffchainTagInstance, OffchainTagAttributes>('OffchainTag', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
    community_id: { type: dataTypes.STRING, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
  });

  OffchainTag.associate = (models) => {
    models.OffchainTag.belongsTo(models.OffchainCommunity, {
      as: 'community',
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.OffchainTag.belongsTo(models.Chain, {
      as: 'chain',
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.OffchainTag.belongsToMany(models.OffchainThread, {
      through: models.TaggedThread,
      as: 'threads',
      foreignKey: 'tag_id',
      otherKey: 'thread_id',
    });
  };

  return OffchainTag;
};
