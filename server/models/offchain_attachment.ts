module.exports = (sequelize, DataTypes) => {
  const OffchainAttachment = sequelize.define('OffchainAttachment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    attachable: { type: DataTypes.STRING, allowNull: false },
    attachment_id: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['attachable', 'attachment_id'] },
    ],
  });

  OffchainAttachment.associate = (models) => {
    models.OffchainAttachment.belongsTo(models.OffchainComment, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'comment',
    });
    models.OffchainAttachment.belongsTo(models.OffchainThread, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'thread',
    });
  };

  return OffchainAttachment;
};
