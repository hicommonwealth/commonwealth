module.exports = (sequelize, DataTypes) => {
  const OffchainComment = sequelize.define('OffchainComment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: DataTypes.STRING, allowNull: true },
    root_id: { type: DataTypes.STRING, allowNull: false },
    parent_id: { type: DataTypes.INTEGER, allowNull: true },
    child_comments: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false, defaultValue: [] },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    community: { type: DataTypes.STRING, allowNull: true },
    version_history: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [], allowNull: false }
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'root_id'] },
      { fields: ['address_id'] },
    ],
  });

  OffchainComment.associate = (models) => {
    models.OffchainComment.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.OffchainCommunity, {
      foreignKey: 'community',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id'
    });
    models.OffchainComment.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: {
        attachable: 'comment',
      },
    });
  };

  return OffchainComment;
};
