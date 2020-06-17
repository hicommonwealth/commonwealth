import * as Sequelize from 'sequelize';

import { OffchainCommunityAttributes } from './offchain_community';

export enum InviteLinkTimeLimit {
  '24h' = '24h',
  '48h' = '48h',
  '1w' = '1w',
  '30d' = '30d',
  'none' = 'none',
}

export interface InviteLinkAttributes {
  id?: number;
  community_id: string;
  creator_id: number;
  active?: boolean;
  multi_use?: number;
  used?: number;
  time_limit?: InviteLinkTimeLimit;
  created_at?: Date;
  updated_at?: Date;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface InviteLinkInstance
extends Sequelize.Instance<InviteLinkAttributes>, InviteLinkAttributes {

}

export interface InviteLinkModel
extends Sequelize.Model<InviteLinkInstance, InviteLinkAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): InviteLinkModel => {
  const InviteLink = sequelize.define<InviteLinkInstance, InviteLinkAttributes>('InviteLink', {
    id: { type: dataTypes.STRING, primaryKey: true, allowNull: false },
    community_id: { type: dataTypes.STRING, allowNull: false },
    creator_id: { type: dataTypes.INTEGER, allowNull: false },
    active: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    multi_use: { type: dataTypes.INTEGER, allowNull: true, defaultValue: null },
    used: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    time_limit: {
      type: dataTypes.ENUM,
      values: Object.keys(InviteLinkTimeLimit),
      defaultValue: 'none',
      allowNull: false,
    },
  }, {
    underscored: true,
    indexes: [
      { fields: ['id'] },
    ],
  });

  InviteLink.associate = (models) => {
    models.InviteLink.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return InviteLink;
};
