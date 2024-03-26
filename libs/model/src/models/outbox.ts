import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import { ModelInstance, ModelStatic } from './types';

export type OutboxAttributes = z.infer<typeof schemas.entities.Outbox>;

export type OutboxInstance = ModelInstance<OutboxAttributes>;

export type OutboxModelStatic = ModelStatic<OutboxInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OutboxModelStatic => {
  const outbox = <OutboxModelStatic>sequelize.define(
    'Outbox',
    {
      // Sequelize v6 doesn't support having an id column that isn't a primary key
      // https://github.com/sequelize/sequelize/pull/14386
      // id: { type: dataTypes.BIGINT, autoIncrement: true, primaryKey: false },
      event_name: { type: dataTypes.TEXT, allowNull: false },
      event_payload: { type: dataTypes.JSONB, allowNull: false },
      relayed: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'Outbox',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );

  outbox.removeAttribute('id');
  return outbox;
};
