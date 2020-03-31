module.exports = (sequelize, DataTypes) => {
  const TaggedThread = sequelize.define('TaggedThread', {
    tag_id: { type: DataTypes.STRING, allowNull: false },
    thread_id: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
  });
  return TaggedThread;
};
