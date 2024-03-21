import { EventContext, schemas } from '@hicommonwealth/core';
// import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
// import type { DataTypes } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { DB } from './index';
// import { ModelInstance, ModelStatic } from './types';

export type OutboxAttributes = z.infer<typeof schemas.entities.Outbox>;

export type InsertOutboxEvent = EventContext<schemas.Events> & {
  created_at?: Date;
};

export async function insertOutbox(
  models: DB,
  events: [InsertOutboxEvent, ...InsertOutboxEvent[]],
): Promise<number[]> {
  let values = '';
  const replacements: Record<string, unknown> = {};
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    // TODO: validate event.payload with Zod?
    values += `(:eventName${index}, :eventPayload${index}, false, :createdAt${index}, CURRENT_TIMESTAMP),`;
    replacements[`eventName${index}`] = event.name;
    replacements[`eventPayload${index}`] = JSON.stringify({
      ...event.payload,
      event_name: event.name,
    });
    replacements[`createdAt${index}`] = event.created_at;
  }

  // remove trailing comma
  values = values.slice(0, -1);

  const res = (await models.sequelize.query(
    `
    INSERT INTO "Outbox"(event_name, event_payload, relayed, created_at, updated_at) VALUES
    ${values} RETURNING id;
  `,
    { replacements, type: QueryTypes.INSERT },
  )) as unknown as [{ id: string }[], number];

  const ids: number[] = [];
  for (const obj of res[0]) {
    ids.push(parseInt(obj.id));
  }
  return ids;
}

//
// export type OutboxInstance = ModelInstance<OutboxAttributes>;
//
// export type OutboxModelStatic = ModelStatic<OutboxInstance>;
//
// export default (
//   sequelize: Sequelize.Sequelize,
//   dataTypes: typeof DataTypes,
// ): OutboxModelStatic => {
//   const outbox = <OutboxModelStatic>sequelize.define(
//     'Outbox',
//     {
//       // Sequelize v6 doesn't support having an id column that isn't a primary key
//       // https://github.com/sequelize/sequelize/pull/14386
//       // id: { type: dataTypes.BIGINT, autoIncrement: true, primaryKey: false },
//       event_id: { type: dataTypes.BIGINT, autoIncrement: true },
//       event_name: { type: dataTypes.STRING, allowNull: false },
//       event_payload: { type: dataTypes.JSONB, allowNull: false },
//       relayed: {
//         type: dataTypes.BOOLEAN,
//         allowNull: false,
//         defaultValue: false,
//       },
//       created_at: { type: dataTypes.DATE, allowNull: true },
//       updated_at: { type: dataTypes.DATE, allowNull: true },
//     },
//     {
//       tableName: 'Outbox',
//       timestamps: true,
//       createdAt: 'created_at',
//       updatedAt: 'updated_at',
//       underscored: false,
//     },
//   );
//
//   outbox.removeAttribute('id');
//   return outbox;
// };
