module.exports = (sequelize, DataTypes) => {
  const OffchainThread = sequelize.define('OffchainThread', {
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    kind: { type: DataTypes.TEXT, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: true },
    pinned: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain: { type: DataTypes.STRING, allowNull: true },
    community: { type: DataTypes.STRING, allowNull: true },
    private: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    read_only: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    version_history: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [], allowNull: false }
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['author_id'] },
    ],
  });

  OffchainThread.associate = (models) => {
    models.OffchainThread.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainThread.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainThread.belongsTo(models.Address, { foreignKey: 'author_id', targetKey: 'id' });
    models.OffchainThread.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
    models.OffchainThread.belongsToMany(models.OffchainTag, {
      through: models.TaggedThread,
      as: 'tags',
      foreignKey: 'thread_id',
      otherKey: 'tag_id',
    });
    models.OffchainThread.belongsToMany(models.Role, {
      through: 'read_only_roles_threads',
      as: 'read_only_roles',
      foreignKey: 'thread_id',
      otherKey: 'id',
    });
    models.OffchainThread.belongsToMany(models.Role, {
      through: 'private_thread_roles',
      as: 'private_roles',
      foreignKey: 'thread_id',
      otherKey: 'id',
    });
  };

  return OffchainThread;
};
