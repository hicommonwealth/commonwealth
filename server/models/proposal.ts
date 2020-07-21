/**
 * NOTE: THIS MODEL IS DEPRECATED DO NOT USE
 */

module.exports = (sequelize, DataTypes) => {
  const Proposal = sequelize.define('Proposal', {
    chain: { type: DataTypes.STRING, allowNull: false },
    identifier: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.JSON, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    final_state: { type: DataTypes.JSON, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['chain', 'type', 'identifier'], unique: true },
    ],
  });

  Proposal.associate = (models) => {
    models.Proposal.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Proposal.hasMany(models.OffchainReaction, { foreignKey: 'proposal_id', targetKey: 'identifier' })
  };

  return Proposal;
};
