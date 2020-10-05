import * as Sequelize from 'sequelize';
import { AddressAttributes } from './address';
import { OffchainCommunityAttributes } from './offchain_community';
import { ChainAttributes } from './chain';

export type Permission = 'admin' | 'moderator' | 'member';

export interface RoleAttributes {
  id?: number;
  address_id: number;
  offchain_community_id?: string;
  chain_id?: string;
  is_user_default?: boolean;
  permission: Permission;
  created_at?: Date;
  updated_at?: Date;

  // associations
  Address?: AddressAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Chain?: ChainAttributes;
}

export interface RoleInstance extends Sequelize.Instance<RoleAttributes>, RoleAttributes {

}

export interface RoleModel extends Sequelize.Model<RoleInstance, RoleAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): RoleModel => {
  const Role = sequelize.define<RoleInstance, RoleAttributes>('Role', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    offchain_community_id: { type: dataTypes.STRING, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    is_user_default: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false, },
    permission: {
      type: dataTypes.ENUM,
      values: ['admin', 'moderator', 'member'],
      defaultValue: 'member',
      allowNull: false,
    },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['address_id'] },
      { fields: ['offchain_community_id'] },
      { fields: ['chain_id'] },
      { fields: ['address_id', 'chain_id'], unique: true },
      { fields: ['address_id', 'offchain_community_id'], unique: true },
    ],
    validate: {
      // roles should only have 1 of these properties
      eitherOffchainOrOnchain() {
        if (this.chain_id && this.offchain_community_id) {
          throw new Error('Roles can have either chain_id or offchain_community_id, not both!');
        }
      }
    }
  });

  Role.associate = (models) => {
    models.Role.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.Role.belongsTo(models.OffchainCommunity, { foreignKey: 'offchain_community_id', targetKey: 'id' });
    models.Role.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return Role;
};
