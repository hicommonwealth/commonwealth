import { EventContext, Events, Outbox } from '@hicommonwealth/core';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { ModelInstance, ModelStatic } from './types';

export type OutboxAttributes = z.infer<typeof Outbox>;

export type InsertOutboxEvent = EventContext<Events> & {
  created_at?: Date;
};

export type OutboxInstance = ModelInstance<OutboxAttributes>;

export type OutboxModelStatic = ModelStatic<OutboxInstance>;

export default (sequelize: Sequelize.Sequelize): OutboxModelStatic => {
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
         * DB. Issue to track: https://github.com/sequelize/sequelize/issues/12718
         */
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true,
        autoIncrementIdentity: true,
        set() {
          throw new Error('event_id is read-only');
        },
      },
      event_name: { type: Sequelize.TEXT, allowNull: false },
      event_payload: { type: Sequelize.JSONB, allowNull: false },
      relayed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
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
