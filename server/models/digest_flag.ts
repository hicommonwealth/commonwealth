module.exports = (sequelize, DataTypes) => {
  const DigestFlag = sequelize.define('DigestFlag', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    offchain_thread_id: { type: DataTypes.INTEGER, allowNull: false },
    offchain_thread_title: { type: DataTypes.TEXT, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    author_id: { type: DataTypes.INTEGER, allowNull: false }, // Address Id from Proposal
    admin_id: { type: DataTypes.INTEGER, allowNull: false }, // User Id from Initial Requestor
    community_id: { type: DataTypes.STRING, allowNull: true },
    default_chain: { type: DataTypes.STRING, allowNull: true },
    votes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    selected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['author_id'] },
    ],
  });

  DigestFlag.associate = (models) => {
    models.DigestFlag.hasOne(models.OffchainThread, { foreignKey: 'digest_flag', targetKey: 'id' });
  };

  return DigestFlag;
};
