import { outbox } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import { ModelInstance, ModelStatic } from './types';

export type OutboxAttributes = z.infer<typeof outbox.Outbox>;

export type OutboxInstance = ModelInstance<OutboxAttributes>;

export type OutboxModelStatic = ModelStatic<OutboxInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OutboxModelStatic => {
  return <OutboxModelStatic>sequelize.define(
    'Outbox',
    {
      id: { type: dataTypes.BIGINT, autoIncrement: true },
      event_name: { type: dataTypes.STRING, allowNull: false },
      event_payload: { type: dataTypes.JSONB, allowNull: false },
      relayed: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: true },
      updated_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'Outbox',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );
};
