import * as Sequelize from 'sequelize';

export type ProjectStatus = 'In Progress' | 'Failed' | 'Successed';

export interface CWProjectAttributes {
  name: string;
  description: string;
  ipfsHash: string;
  cwUrl: string;
  beneficiary: string;
  acceptedToken: string;
  nominations: Array<string>;
  endTime: Date;
  projectHash: string;
  status: ProjectStatus;
  creator: string;
  threshold: number;
  totalFunding: number;
  curatorFee: number;
}

export interface CWProjectInstance extends Sequelize.Instance<CWProjectAttributes>, CWProjectAttributes {
  // no mixins used
}

export interface CWProjectModel extends Sequelize.Model<CWProjectInstance, CWProjectAttributes> {
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): CWProjectModel => {
  const CWProject = sequelize.define<CWProjectInstance, CWProjectAttributes>('CWProject', {
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    ipfsHash: { type: dataTypes.STRING, allowNull: false },
    cwUrl: { type: dataTypes.STRING, allowNull: false },
    beneficiary: { type: dataTypes.STRING, allowNull: false },
    creator: { type: dataTypes.STRING, allowNull: false },
    acceptedToken: { type: dataTypes.STRING, allowNull: false, defaultValue: '0x0000000000000000000000000000000000000000' },  // 0x0000000000000000000000000000000000000000 means Ether
    nominations: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
    threshold: { type: dataTypes.INTEGER, allowNull: false },
    endTime: { type: dataTypes.DATE, allowNull: false },
    // created_at: { type: dataTypes.DATE, allowNull: false },
    curatorFee: { type: dataTypes.INTEGER, allowNull: false },
    projectHash: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
    totalFunding: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: dataTypes.ENUM,
      values: ['In Progress', 'Failed', 'Successed'],
      defaultValue: 'In Progress',
      allowNull: false
    },
  }, {
    underscored: true,
    paranoid: true
  });
  return CWProject;
}