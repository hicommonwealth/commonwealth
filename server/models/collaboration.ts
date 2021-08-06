import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface CollaborationAttributes {
  address_id: number;
  offchain_thread_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CollaborationInstance
extends Model<CollaborationAttributes>, CollaborationAttributes {
  // no mixins used yet
}

export type CollaborationModelStatic = ModelStatic<CollaborationInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CollaborationModelStatic => {
  const Collaboration = <CollaborationModelStatic>sequelize.define(
    'Collaboration', {
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      offchain_thread_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: 'Collaborations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Collaboration.associate = (models) => {
    models.Collaboration.belongsTo(models.Address);
    models.Collaboration.belongsTo(models.OffchainThread);
  };

  return Collaboration;
};
