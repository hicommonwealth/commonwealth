import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

import { ChainAttributes } from './chain';

export interface InviteCodeAttributes {
  creator_id: number;
  id?: string;
  community_name?: string;
  chain_id: string;
  invited_email?: string;
  used?: boolean;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
}

export interface InviteCodeInstance
extends Model<InviteCodeAttributes>, InviteCodeAttributes {}

export type InviteCodeModelStatic = ModelStatic<InviteCodeInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): InviteCodeModelStatic => {
  const InviteCode = <InviteCodeModelStatic>sequelize.define('InviteCode', {
    id: { type: dataTypes.STRING, primaryKey: true },
    chain_id: { type: dataTypes.STRING, allowNull: false },
    community_name: { type: dataTypes.STRING, allowNull: true },
    creator_id: { type: dataTypes.INTEGER, allowNull: false },
    invited_email: { type: dataTypes.STRING, allowNull: true, defaultValue: null },
    used: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'InviteCodes',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['creator_id'] },
    ],
  });

  InviteCode.associate = (models) => {
    models.InviteCode.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return InviteCode;
};
