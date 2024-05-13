import Sequelize from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type { ThreadAttributes, ThreadInstance } from './thread';
import type { ModelInstance } from './types';

export type CollaborationAttributes = {
  address_id: number;
  thread_id: number;
  created_at: Date;
  updated_at: Date;

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

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CollaborationInstance> =>
  sequelize.define(
    'Collaboration',
    {
      address_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      thread_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'Collaborations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
