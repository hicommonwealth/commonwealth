import { EventContext, schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import { ModelInstance, ModelStatic } from './types';

export type OutboxAttributes = z.infer<typeof schemas.entities.Outbox>;

export type InsertOutboxEvent = EventContext<schemas.Events> & {
  created_at?: Date;
};

export type OutboxInstance = ModelInstance<OutboxAttributes>;

export type OutboxModelStatic = ModelStatic<OutboxInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OutboxModelStatic => {
  const outbox = <OutboxModelStatic>sequelize.define(
    'Outbox',
    {
      event_id: {
        /**
         * This column is intentionally not a primary key in the DB. The primary
         * key is set to true here only so that `sequelize.sync()` works. This
         * is ok since the Outbox is not partitioned for tests. The primary key
         * is not enforced on the actual database because you cannot have a
         * primary key on a partitioned table. Additionally, setting
         * autoIncrement without primaryKey: true is not possible so this
         * ensures that sequelize leaves the generation of the event_id to the
         * DB.
         */
        primaryKey: true,
        type: dataTypes.BIGINT,
        autoIncrement: true,
        autoIncrementIdentity: true,
        set() {
          throw new Error('event_id is read-only');
        },
      },
      event_name: { type: dataTypes.STRING, allowNull: false },
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
