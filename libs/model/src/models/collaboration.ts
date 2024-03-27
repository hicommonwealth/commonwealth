import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type { ThreadAttributes, ThreadInstance } from './thread';
import type { ModelInstance, ModelStatic } from './types';

export type CollaborationAttributes = {
  address_id: number;
  thread_id: number;
  created_at?: Date;
  updated_at?: Date;

  Address: AddressAttributes;
  Thread: ThreadAttributes;
};

export type CollaborationInstance = ModelInstance<CollaborationAttributes> & {
  getAddress: Sequelize.BelongsToGetAssociationMixin<AddressInstance>;
  setAddress: Sequelize.BelongsToSetAssociationMixin<
    AddressInstance,
    AddressInstance['id']
  >;
  getThread: Sequelize.BelongsToGetAssociationMixin<ThreadInstance>;
  setThread: Sequelize.BelongsToSetAssociationMixin<
    ThreadInstance,
    ThreadInstance['id']
  >;
};

export type CollaborationModelStatic = ModelStatic<CollaborationInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
) => {
  const Collaboration = <CollaborationModelStatic>sequelize.define(
    'Collaboration',
    {
      address_id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
      },
      thread_id: {
        type: dataTypes.INTEGER,
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
      noPrimaryKey: true,
    } as Sequelize.ModelOptions,
  );

  Collaboration.associate = (models) => {
    models.Collaboration.belongsTo(models.Address, {
      foreignKey: { name: 'thread_id', allowNull: false },
    });
    models.Collaboration.belongsTo(models.Thread, {
      foreignKey: { name: 'thread_id', allowNull: false },
    });
  };

  return Collaboration;
};
