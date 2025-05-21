import Sequelize from 'sequelize';
import { ModelInstance } from './types';

export type LastProcessedSolanaSlotAttributes = {
  chain_node_id: number;
  slot_number: number;
};

export type LastProcessedSolanaSlotInstance =
  ModelInstance<LastProcessedSolanaSlotAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<LastProcessedSolanaSlotInstance> =>
  sequelize.define<LastProcessedSolanaSlotInstance>(
    'LastProcessedSolanaSlot',
    {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      slot_number: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      tableName: 'LastProcessedSolanaSlots',
    },
  );
