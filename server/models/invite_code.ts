import * as Sequelize from 'sequelize';

import { OffchainCommunityAttributes } from './offchain_community';

export interface InviteCodeAttributes {
  id?: number;
  community_id: string;
  community_name?: string;
  creator_id: number;
  invited_email?: string;
  used?: boolean;
  created_at?: Date;
  updated_at?: Date;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface InviteCodeInstance
extends Sequelize.Instance<InviteCodeAttributes>, InviteCodeAttributes {

}

export interface InviteCodeModel
extends Sequelize.Model<InviteCodeInstance, InviteCodeAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): InviteCodeModel => {
  const InviteCode = sequelize.define<InviteCodeInstance, InviteCodeAttributes>('InviteCode', {
    id: { type: dataTypes.STRING, primaryKey: true, autoIncrement: true },
    community_id: { type: dataTypes.STRING, allowNull: false },
    community_name: { type: dataTypes.STRING, allowNull: true },
    creator_id: { type: dataTypes.INTEGER, allowNull: false },
    invited_email: { type: dataTypes.STRING, allowNull: true, defaultValue: null },
    used: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['creator_id'] },
    ],
  });

  InviteCode.associate = (models) => {
    models.InviteCode.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return InviteCode;
};
