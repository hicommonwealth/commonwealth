module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('Webhook', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    url: { type: DataTypes.STRING, allowNull: false },
    chain_id: { type: DataTypes.STRING, allowNull: true },
    offchain_community_id: { type: DataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['url'] },
      { fields: ['chain_id'] },
      { fields: ['offchain_community_id'] },
    ],
    validate: {
      // webhooks should only have 1 of these properties
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

  Webhook.associate = (models) => {
    models.Webhook.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Webhook.belongsTo(models.OffchainCommunity, { foreignKey: 'offchain_community_id', targetKey: 'id' });
  };

  return Webhook;
};
