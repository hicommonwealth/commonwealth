import * as Sequelize from 'sequelize';

export interface TaggedThreadAttributes {
  topic_id: string;
  thread_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TaggedThreadInstance
extends Sequelize.Instance<TaggedThreadAttributes>, TaggedThreadAttributes {

}

export interface TaggedThreadModel extends Sequelize.Model<TaggedThreadInstance, TaggedThreadAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): TaggedThreadModel => {
  const TaggedThread = sequelize.define<TaggedThreadInstance, TaggedThreadAttributes>('TaggedThread', {
    topic_id: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
  });
  return TaggedThread;
};
