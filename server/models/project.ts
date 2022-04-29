import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ChainAttributes } from './chain';
import { ChainEntityAttributes } from './chain_entity';
import { ModelStatic, ModelInstance } from './types';

export type Permission = 'admin' | 'moderator' | 'member';

export type ProjectAttributes = {
  // populated immediately
  id?: number;
  chain_id?: string; // Chains fk, null if created by event
  created_at?: Date;
  updated_at?: Date;

  // populated by creation event
  entity_id?: number; // ChainEntities fk

  // populated from contract queries
  token?: string;
  curator_fee?: string;
  threshold?: string;
  deadline?: number;
  funding_amount?: string;

  Chain?: ChainAttributes;
  Entity?: ChainEntityAttributes;
}

export type ProjectInstance = ModelInstance<ProjectAttributes>;

export type ProjectModelStatic = ModelStatic<ProjectInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ProjectModelStatic => {
  const Project = <ProjectModelStatic>sequelize.define('Project', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    entity_id: { type: dataTypes.INTEGER, allowNull: true },
    token: { type: dataTypes.STRING, allowNull: true },
    curator_fee: { type: dataTypes.STRING, allowNull: true },
    threshold: { type: dataTypes.STRING, allowNull: true },
    deadline: { type: dataTypes.STRING, allowNull: true },
    funding_amount: { type: dataTypes.INTEGER, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Projects',
    underscored: true,
    indexes: [
      { fields: ['chain_id'] },
    ],
  });

  Project.associate = (models) => {
    models.Project.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Project.belongsTo(models.ChainEntity, { foreignKey: 'entity_id', targetKey: 'id' });
  };

  return Project;
};
