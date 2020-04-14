module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    offchain_community_id: { type: DataTypes.STRING, allowNull: true },
    chain_id: { type: DataTypes.STRING, allowNull: true },
    permission: {
      type: DataTypes.ENUM,
      values: ['admin', 'moderator', 'member'],
      defaultValue: 'member',
      allowNull: false,
    },
  }, {
    underscored: true,
    indexes: [
      { fields: ['address_id'] },
      { fields: ['offchain_community_id'] },
      { fields: ['chain_id'] },
    ],
    validate: {
      // roles should only have 1 of these properties
      eitherOffchainOrOnchain() {
        if (!(this.chain_id === undefined || this.offchain_community_id === undefined)) {
          throw new Error('Either chain_id or offchain_community_id!');
        }
        if (this.chain_id !== undefined && this.offchain_community_id !== undefined) {
          throw new Error('Either chain_id or offchain_community_id not both!');
        }
      }
    }
  });

  Role.associate = (models) => {
    models.Role.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.Role.belongsTo(models.OffchainCommunity, { foreignKey: 'offchain_community_id', targetKey: 'id' });
    models.Role.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Role.belongsToMany(models.OffchainThread, {
      through: 'read_only_roles_threads',
      as: 'read_only_threads',
      foreignKey: 'id',
      otherKey: 'thread_id'
    });
    models.Role.belongsToMany(models.OffchainThread, {
      through: 'private_thread_roles',
      as: 'private_threads',
      foreignKey: 'id',
      otherKey: 'thread_id',
    });
  };

  return Role;
};
