import * as Sequelize from 'sequelize';

export interface OffchainProfileAttributes {
  address_id: number;
  data?: string;
}

export interface OffchainProfileInstance
extends Sequelize.Instance<OffchainProfileAttributes>, OffchainProfileAttributes {

}

export type OffchainProfileModel = Sequelize.Model<OffchainProfileInstance, OffchainProfileAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainProfileModel => {
  const OffchainProfile = sequelize.define<OffchainProfileInstance, OffchainProfileAttributes>(
    'OffchainProfile', {
      address_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      data: { type: dataTypes.TEXT, allowNull: true },
    }, {
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['address_id'] },
      ],
    }
  );

  OffchainProfile.associate = (models) => {
    models.OffchainProfile.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
  };

  return OffchainProfile;
};
