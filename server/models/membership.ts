import * as Sequelize from 'sequelize';

import { UserAttributes } from './user';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';

export interface MembershipAttributes {
  id?: number;
  user_id: number;
  chain?: string;
  community?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface MembershipInstance extends Sequelize.Instance<MembershipAttributes>, MembershipAttributes {
  // no mixins used
}

export interface MembershipModel extends Sequelize.Model<MembershipInstance, MembershipAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): MembershipModel => {
  const Membership = sequelize.define<MembershipInstance, MembershipAttributes>('Membership', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: dataTypes.INTEGER, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    active: { type: dataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['chain'] },
      { fields: ['community'] },
    ],
  });

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.User);
    models.Membership.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Membership.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
  };

  return Membership;
};
