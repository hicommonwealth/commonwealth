import * as Sequelize from 'sequelize';

export interface SharingPermissionAttributes {
  address_id: number;
  offchain_thread_id: number;
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
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      offchain_thread_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true,
    }
  );

  SharingPermission.associate = (models) => {
    models.SharingPermission.belongsTo(models.Address);
    models.SharingPermission.belongsTo(models.OffchainThread);
  };

  return SharingPermission;
};
