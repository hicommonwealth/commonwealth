import * as Sequelize from 'sequelize';

export interface CollaborationAttributes {
  address_id: number;
  offchain_thread_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CollaborationInstance
extends Sequelize.Instance<CollaborationAttributes>, CollaborationAttributes {
  // no mixins used yet
}

export interface CollaborationModel extends Sequelize.Model<
  CollaborationInstance, CollaborationAttributes
> {
  // no static methods yet
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): CollaborationModel => {
  const Collaboration = sequelize.define<CollaborationInstance, CollaborationAttributes>(
    'Collaboration', {
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      offchain_thread_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true,
    }
  );

  Collaboration.associate = (models) => {
    models.Collaboration.belongsTo(models.Address);
    models.Collaboration.belongsTo(models.OffchainThread);
  };

  return Collaboration;
};
