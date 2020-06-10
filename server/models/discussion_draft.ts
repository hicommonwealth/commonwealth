module.exports = (sequelize, DataTypes) => {
  const DiscussionDraft = sequelize.define('DiscussionDraft', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    tag: { type: DataTypes.STRING, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    chain: { type: DataTypes.STRING, allowNull: true },
    community: { type: DataTypes.STRING, allowNull: true },
    attachment: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['author_id'] },
    ],
  });

  DiscussionDraft.associate = (models) => {
    models.DiscussionDraft.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.DiscussionDraft.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.DiscussionDraft.belongsTo(models.Address, { foreignKey: 'author_id', targetKey: 'id' });
    models.DiscussionDraft.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
  };

  return DiscussionDraft;
};
