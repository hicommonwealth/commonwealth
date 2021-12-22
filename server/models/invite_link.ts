import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export enum InviteLinkTimeLimit {
  '24h' = '24h',
  '48h' = '48h',
  '1w' = '1w',
  '1m' = '1m',
  '30d' = '30d',
  'none' = 'none',
}

export interface InviteLinkAttributes {
  creator_id: number;
  id?: string;
  chain_id?: string;
  active?: boolean;
  multi_use?: number;
  used?: number;
  time_limit?: InviteLinkTimeLimit;
  created_at?: Date;
  updated_at?: Date;
}

export interface InviteLinkInstance
extends Model<InviteLinkAttributes>, InviteLinkAttributes {}

export type InviteLinkModelStatic = ModelStatic<InviteLinkInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): InviteLinkModelStatic => {
  const InviteLink = <InviteLinkModelStatic>sequelize.define('InviteLink', {
    id: { type: dataTypes.STRING, primaryKey: true, allowNull: false },
    chain_id: { type: dataTypes.STRING, allowNull: true },
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
    tableName: 'InviteLinks',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['id'] },
    ],
  });

  InviteLink.associate = (models) => {
    models.InviteLink.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return InviteLink;
};
