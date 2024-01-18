import Sequelize, { DataTypes } from 'sequelize';
import { DB } from '.';
import { ModelInstance, ModelStatic } from './types';

export type LastProcessedEvmBlockAttributes = {
  chain_node_id: number;
  block_number: number;
};

export type LastProcessedEvmBlockInstance =
  ModelInstance<LastProcessedEvmBlockAttributes>;

export type LastProcessedEvmBlockModelStatic =
  ModelStatic<LastProcessedEvmBlockInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): LastProcessedEvmBlockModelStatic => {
  const LastProcessedEvmBlock: LastProcessedEvmBlockModelStatic = <
    LastProcessedEvmBlockModelStatic
  >sequelize.define(
    'LastProcessedEvmBlock',
    {
      chain_node_id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
      },
      block_number: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      tableName: 'LastProcessedEvmBlocks',
    },
  );

  LastProcessedEvmBlock.associate = (models: DB) => {
    models.LastProcessedEvmBlock.belongsTo(models.ChainNode, {
      foreignKey: 'chain_node_id',
      targetKey: 'id',
    });
  };

  return LastProcessedEvmBlock;
};
