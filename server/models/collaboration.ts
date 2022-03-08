import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { AddressInstance, AddressAttributes } from './address';
import {
  OffchainThreadInstance,
  OffchainThreadAttributes,
} from './offchain_thread';

export type CollaborationAttributes = {
  address_id: number;
  offchain_thread_id: number;
  created_at?: Date;
  updated_at?: Date;

  Address: AddressAttributes;
  OffchainThread: OffchainThreadAttributes;
};

export type CollaborationInstance = ModelInstance<CollaborationAttributes> & {
  // no mixins used yet
  getAddress: Sequelize.BelongsToGetAssociationMixin<AddressInstance>;
  setAddress: Sequelize.BelongsToSetAssociationMixin<
    AddressInstance,
    AddressInstance['id']
  >;
  getOffchainThread: Sequelize.BelongsToGetAssociationMixin<OffchainThreadInstance>;
  setOffchainThread: Sequelize.BelongsToSetAssociationMixin<
    OffchainThreadInstance,
    OffchainThreadInstance['id']
  >;
};

export type CollaborationModelStatic = ModelStatic<CollaborationInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
) => {
  const Collaboration = <CollaborationModelStatic>sequelize.define(
    'Collaboration',
    {
      address_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      offchain_thread_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
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
