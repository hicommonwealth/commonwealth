import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ChainAttributes } from './chain';
import type { Permission } from './role';
import type {
  MembershipAttributes,
  MembershipInstance,
} from './membership';
import type { ModelInstance, ModelStatic } from './types';

export type MemberClassAttributes = {
  name: Permission;
  id?: number;
  chain_id: string;
  allow: bigint;
  deny: bigint;
  created_at?: Date;
  updated_at?: Date;

  // associations
  Memberships?: MembershipAttributes[];
  Chain?: ChainAttributes;
};

export type MemberClassInstance = ModelInstance<MemberClassAttributes> & {
  getMemberships: Sequelize.HasManyGetAssociationsMixin<MembershipInstance>;
};

export type MemberClassModelStatic = ModelStatic<MemberClassInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): MemberClassModelStatic => {
  const MemberClass = <MemberClassModelStatic>sequelize.define(
    'MemberClass',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain_id: { type: dataTypes.STRING, allowNull: false },
      name: {
        type: dataTypes.ENUM,
        values: ['admin', 'moderator', 'member'],
        defaultValue: 'member',
        allowNull: false,
      },
      allow: {
        type: dataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      deny: {
        type: dataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'MemberClasses',
      underscored: true,
      indexes: [{ fields: ['chain_id'] }],
    }
  );

  MemberClass.associate = (models) => {
    models.MemberClass.hasMany(models.Membership, {
      foreignKey: 'member_class_id',
    });
    models.MemberClass.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
  };

  return MemberClass;
};
