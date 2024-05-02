import { generateMock } from '@anatine/zod-mock';
import { DeepPartial } from '@hicommonwealth/core';
import { Aggregates, Entities, entities } from '@hicommonwealth/schemas';
import { Model, ModelStatic } from 'sequelize';
import z, { ZodNullable, ZodObject, ZodUnknown } from 'zod';
import type { State } from '../models';
import { bootstrap_testing } from './bootstrap';

/**
 * Seed options
 *
 * @param mock true to auto mock values in schemas
 * @param log log new records to console
 */
export type SeedOptions = {
  mock: boolean;
  log?: boolean;
};

function isNullable(value: ZodUnknown) {
  if (value instanceof ZodNullable) return true;
  if (!('innerType' in value._def)) return false;
  return isNullable(value._def.innerType as ZodUnknown);
}

/**
 * Seeds aggregate for unit testing
 * - Partial seed values can be provided to define attributes specific to the unit test, and to drive how many child entities are created
 *
 * @param name name of the aggregate to seed
 * @param values partial seed values specific to the unit test
 * @param options seed options - defaults to mocking without skips
 * @returns tuple with main aggregate record and array of total records created
 * @see "libs/model/\_\_tests\_\_/community/group-lifecycle.spec.ts"
 */
export async function seed<T extends Aggregates>(
  name: T,
  values?: DeepPartial<z.infer<typeof entities[T]>>,
  options: SeedOptions = { mock: true },
): Promise<[z.infer<typeof entities[T]> | undefined, State[]]> {
  const db = await bootstrap_testing();

  const records: State[] = [];
  await _seed(db![name], values ?? {}, options, records, 0);
  return [records.at(0) as any, records];
}

async function _seed(
  model: ModelStatic<Model>,
  values: State,
  options: SeedOptions,
  records: State[],
  level: number,
) {
  const schema = entities[model.name as Entities];
  if (schema && options.mock && schema instanceof ZodObject) {
    const mocked = generateMock(schema, {});
    // force undefined associations
    const undefs = {} as State;
    Object.entries(schema.shape).forEach(([key, value]) => {
      if (key !== 'id' && typeof values[key] === 'undefined') {
        if (model.associations[key]) undefs[key] = [];
        else if (isNullable(value)) undefs[key] = null;
      }
    });
    values = { ...mocked, ...undefs, ...values };
  }
  const record = (
    await model.create(values, { logging: options.log ? console.log : false })
  ).toJSON();
  records.push(record);

  if (typeof values === 'object') {
    for (const [key, value] of Object.entries(values)) {
      const association = model.associations[key];
      if (association && Array.isArray(value)) {
        record[key] = [];
        for (const el of value) {
          const child = await _seed(
            association.target,
            {
              ...el,
              [association.foreignKey]: record[model.primaryKeyAttribute],
            },
            options,
            records,
            level + 1,
          );
          record[key].push(child);
        }
      }
    }
  }

  level === 0 && options.log && console.log(model.tableName, record);
  return record;
}
