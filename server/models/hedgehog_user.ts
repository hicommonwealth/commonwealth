import * as Sequelize from 'sequelize';

export interface HedgehogUserAttributes {
  id?: number;
  username: string;
  walletAddress: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface HedgehogUserInstance extends Sequelize.Instance<HedgehogUserAttributes>, HedgehogUserAttributes {

}

export interface HedgehogUserModel extends Sequelize.Model<HedgehogUserInstance, HedgehogUserAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): HedgehogUserModel => {
  const HedgehogUser = sequelize.define<HedgehogUserInstance, HedgehogUserAttributes>('HedgehogUser', {
    id:            { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    username:      { type: dataTypes.STRING, allowNull: false, unique: true },
    walletAddress: { type: dataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
  });

  return HedgehogUser;
};
