import * as Sequelize from 'sequelize';

export interface HedgehogAuthenticationAttributes {
  iv: string;
  cipherText: string;
  lookupKey: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface HedgehogAuthenticationInstance
extends Sequelize.Instance<HedgehogAuthenticationAttributes>, HedgehogAuthenticationAttributes {

}

export interface HedgehogAuthenticationModel extends Sequelize.Model<
  HedgehogAuthenticationInstance, HedgehogAuthenticationAttributes
> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): HedgehogAuthenticationModel => {
  const HedgehogAuthentication = sequelize.define<
    HedgehogAuthenticationInstance, HedgehogAuthenticationAttributes
  >('HedgehogAuthentication', {
    iv:         { type: dataTypes.STRING, allowNull: false },
    cipherText: { type: dataTypes.STRING, allowNull: false },
    lookupKey:  { type: dataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
  }, {
    underscored: true
  });

  return HedgehogAuthentication;
};
