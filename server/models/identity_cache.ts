import * as Sequelize from 'sequelize';

export interface IdentityCacheAttributes {
  chain: string;
  address: string;
}

export interface IdentityCacheInstance
  extends Sequelize.Instance<IdentityCacheAttributes>,
    IdentityCacheAttributes {}

export interface IdentityCacheModel
  extends Sequelize.Model<IdentityCacheInstance, IdentityCacheAttributes> {}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes
): IdentityCacheModel => {
  const IdentityCache = sequelize.define<
    IdentityCacheInstance,
    IdentityCacheAttributes
  >(
    'IdentityCache',
    {
      chain: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: false }
    },
    { timestamps: false }
  );

  IdentityCache.associate = (models) => {
    models.IdentityCache.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id'
    });
  };

  return IdentityCache;
};
