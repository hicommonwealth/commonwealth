import * as Sequelize from 'sequelize';

export interface SharingPermissionAttributes {
  user_id: number;
  thread_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface SharingPermissionInstance
extends Sequelize.Instance<SharingPermissionAttributes>, SharingPermissionAttributes {
  // no mixins used yet
}

export interface SharingPermissionModel extends Sequelize.Model<
  SharingPermissionInstance, SharingPermissionAttributes
> {
  // no static methods yet
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): SharingPermissionModel => {
  const SharingPermission = sequelize.define<SharingPermissionInstance, SharingPermissionAttributes>(
    'SharingPermission', {
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true,
    }
  );
  return SharingPermission;
};
