import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ChainAttributes } from './chain';
import { ChainEntityMetaAttributes } from './chain_entity_meta';
import { IpfsPinAttributes } from './ipfs_pin';
import { ModelStatic, ModelInstance } from './types';

// TODO, updating with data necessary to populate client-side model,
// e.g. incl description, title, coverImage, etc

export type ProjectAttributes = {
  // populated immediately
  id: number;
  entity_id: number;
  chain_id?: string;

  created_at?: Date;
  updated_at?: Date;

  Chain?: ChainAttributes;
  ChainEntityMeta?: ChainEntityMetaAttributes;
};

export type ProjectInstance = ModelInstance<ProjectAttributes>;

export type ProjectModelStatic = ModelStatic<ProjectInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ProjectModelStatic => {
  const Project = <ProjectModelStatic>sequelize.define(
    'Project',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, allowNull: false },
      entity_id: { type: dataTypes.INTEGER, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: true },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Projects',
      underscored: true,
      indexes: [], // TODO: determine which indexes are needed
    }
  );

  Project.associate = (models) => {
    models.Project.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.Project.belongsTo(models.ChainEntityMeta, {
      foreignKey: 'entity_id',
      targetKey: 'id',
    });
  };

  return Project;
};
