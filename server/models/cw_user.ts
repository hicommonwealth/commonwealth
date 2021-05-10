import * as Sequelize from 'sequelize';

export type ParticipantRole = 'backer' | 'curator' | 'beneficiary' | 'creator'

export interface CWUserAttributes {
  id?: number;
  address: string;
  role: ParticipantRole;
  projectHash: string;
  amount: number;
  token: string;
}

export interface CWUserInstance extends Sequelize.Instance<CWUserAttributes>, CWUserAttributes {

}

export interface CWUserModel extends Sequelize.Model<CWUserInstance, CWUserAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): CWUserModel => {
  const CWUser = sequelize.define<CWUserInstance, CWUserAttributes>('CWUser', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: dataTypes.STRING, allowNull: false },
    projectHash: { type: dataTypes.STRING, allowNull: false },
    amount: { type: dataTypes.STRING, allowNull: false },
    token: { type: dataTypes.STRING, allowNull: false },
    role: {
      type: dataTypes.ENUM,
      values: [ 'backer', 'curator', 'beneficiary', 'creator' ],
      defaultValue: 'creator',
      allowNull: false,
    }
  }, {
    underscored: true,
  });

  // CWUser.associate = (models) => {
  //   models.CWUser.belongsTo(models.CWProject, { foreignKey: 'projectHash', targetKey: 'projectHash' });
  // };

  return CWUser;
};
