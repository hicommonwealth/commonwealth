import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type TaggedThreadAttributes = {
  topic_id: string;
  thread_id: number;
  created_at?: Date;
  updated_at?: Date;
};

export type TaggedThreadInstance = ModelInstance<TaggedThreadAttributes>;

export type TaggedThreadModelStatic = ModelStatic<TaggedThreadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): TaggedThreadModelStatic => {
  const TaggedThread = <TaggedThreadModelStatic>sequelize.define(
    'TaggedThread',
    {
      topic_id: { type: dataTypes.STRING, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'TaggedThreads',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
  return TaggedThread;
};
