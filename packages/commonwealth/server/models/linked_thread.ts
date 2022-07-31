import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ThreadInstance } from './thread';

export type LinkedThreadAttributes = {
  id?: number;
  linked_thread: number;
  linking_thread: number;
  created_at?: Date;
  updated_at?: Date;
}

export type LinkedThreadInstance = ModelInstance<LinkedThreadAttributes> & {
  getThread: Sequelize.BelongsToGetAssociationMixin<ThreadInstance>;
  setThread: Sequelize.BelongsToSetAssociationMixin<
    ThreadInstance,
    ThreadInstance['id']
  >;
}

export type LinkedThreadModelStatic = ModelStatic<LinkedThreadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
) => {
  const LinkedThread = <LinkedThreadModelStatic>sequelize.define(
    'LinkedThread',
    {
      linked_thread: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      linking_thread: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'LinkedThreads',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  LinkedThread.associate = (models) => {
    models.LinkedThread.belongsTo(models.Thread, {
      foreignKey: 'linking_thread',
      targetKey: 'id',
    });
    models.LinkedThread.belongsTo(models.Thread, {
      foreignKey: 'linked_thread',
      targetKey: 'id',
    });
  };

  return LinkedThread;
};
