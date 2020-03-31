module.exports = (sequelize, DataTypes) => {
  const ChainObjectQuery = sequelize.define('ChainObjectQuery', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    object_type: { type: DataTypes.STRING, allowNull: false },
    query_type: { type: DataTypes.ENUM('INIT', 'ADD', 'UPDATE'), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false },

    description: { type: DataTypes.TEXT, allowNull: false },
    query_url: { type: DataTypes.STRING, allowNull: false },
    // raw text of graphql query to be executed by fetcher
    query: { type: DataTypes.TEXT, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['object_type', 'query_type'] },
    ],
  });

  ChainObjectQuery.associate = (models) => {
    models.ChainObjectQuery.belongsTo(models.ChainObjectVersion, { foreignKey: 'object_type', targetKey: 'id' });
  };

  return ChainObjectQuery;
};
