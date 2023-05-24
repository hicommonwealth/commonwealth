import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ChainAttributes } from './chain';
import type { ModelInstance, ModelStatic } from './types';

export type ChainEntityMetaAttributes = {
  id: number; // sequelize auto-generated primary key id --- NEVER USE DIRECTLY
  // this is the primary key id from the chain-events service
  // (used to match chain-entity-meta with chain-entities from chain-events)
  ce_id: number;
  title?: string;
  chain_name: string;
  author?: string;
  type_id?: string;
  project_chain?: string;
  contract_address?: string;

  ProjectChain?: ChainAttributes;
};

export type ChainEntityMetaInstance = ModelInstance<ChainEntityMetaAttributes>;

export type ChainEntityMetaModelStatic = ModelStatic<ChainEntityMetaInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEntityMetaModelStatic => {
  const ChainEntityMeta = <ChainEntityMetaModelStatic>sequelize.define<
    ChainEntityMetaInstance,
    ChainEntityMetaAttributes
  >(
    'ChainEntityMeta',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ce_id: { type: dataTypes.INTEGER, allowNull: false, unique: true },
      title: { type: dataTypes.STRING, allowNull: true },
      chain_name: { type: dataTypes.STRING, allowNull: false },
      author: { type: dataTypes.STRING, allowNull: true },
      type_id: { type: dataTypes.STRING, allowNull: true },
      project_chain: { type: dataTypes.STRING, allowNull: true },
      contract_address: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ChainEntityMeta',
      timestamps: false,
      underscored: true,
      paranoid: false,
      indexes: [{ fields: ['chain_name', 'contract_address'] }],
    }
  );

  ChainEntityMeta.associate = (models) => {
    models.ChainEntityMeta.belongsTo(models.Chain, {
      foreignKey: 'project_chain',
      targetKey: 'id',
      as: 'ProjectChain',
    });
  };

  return ChainEntityMeta;
};
