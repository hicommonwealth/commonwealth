import * as Sequelize from 'sequelize';
import { BuildOptions, DataTypes, Model } from 'sequelize';

export interface TaggedThreadAttributes {
  topic_id: string;
  thread_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TaggedThreadInstance
extends Model<TaggedThreadAttributes>, TaggedThreadAttributes {}

type TaggedThreadModelStatic = typeof Sequelize.Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: Sequelize.BuildOptions): TaggedThreadInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): TaggedThreadModelStatic => {
  const TaggedThread = <TaggedThreadModelStatic>sequelize.define('TaggedThread', {
    topic_id: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'TaggedThreads',
    timestamps: true,
    underscored: true,
  });
  return TaggedThread;
};
