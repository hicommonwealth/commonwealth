import Sequelize from 'sequelize';
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
): LastProcessedEvmBlockModelStatic => {
  const LastProcessedEvmBlock: LastProcessedEvmBlockModelStatic = <
    LastProcessedEvmBlockModelStatic
  >sequelize.define(
    'LastProcessedEvmBlock',
    {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      block_number: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      tableName: 'LastProcessedEvmBlocks',
    },
  );

  LastProcessedEvmBlock.associate = (models) => {
    models.LastProcessedEvmBlock.belongsTo(models.ChainNode, {
      foreignKey: 'chain_node_id',
      targetKey: 'id',
    });
  };

  return LastProcessedEvmBlock;
};
