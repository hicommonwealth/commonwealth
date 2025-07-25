import { generateMock } from '@anatine/zod-mock';
import { DeepPartial } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  CommunityTierMap,
  DisabledCommunitySpamTier,
  UserTierMap,
} from '@hicommonwealth/shared';
import { randomInt } from 'crypto';
import { Model, type ModelStatic } from 'sequelize';
import z, {
  ZodArray,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodUnknown,
} from 'zod';
import { models } from '../database';
import type { State } from '../models';

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

function isArray(
  value: ZodUnknown | ZodOptional<ZodUnknown> | ZodNullable<ZodUnknown>,
) {
  if (value instanceof ZodOptional || value instanceof ZodNullable)
    return isArray(value._def.innerType);
  return value instanceof ZodArray;
}

function isString(
  value: ZodUnknown | ZodOptional<ZodUnknown> | ZodNullable<ZodUnknown>,
) {
  if (value instanceof ZodOptional || value instanceof ZodNullable)
    return isString(value._def.innerType);
  return value instanceof ZodString;
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
export async function seed<T extends schemas.Aggregates>(
  name: T,
  values?: DeepPartial<z.infer<(typeof schemas)[T]>>,
  options: SeedOptions = { mock: true },
): Promise<[z.infer<(typeof schemas)[T]> | undefined, State[]]> {
  const records: State[] = [];
  await _seed(models![name], values ?? {}, options, records, 0);
  return [records.at(0) as any, records];
}

/**
 * Seeds multiple aggregates and returns record indexed by keys
 */
export async function seedRecord<T extends schemas.Aggregates, K>(
  name: T,
  keys: Readonly<Array<keyof K>>,
  valuesFn: (key: keyof K) => DeepPartial<z.infer<(typeof schemas)[T]>>,
): Promise<Record<keyof K, z.infer<(typeof schemas)[T]>>> {
  const values = await Promise.all(
    keys.map(async (key) => {
      const [value] = await seed(name, valuesFn(key));
      return [key, value];
    }),
  );
  return values.reduce(
    (record, [key, value]) =>
      Object.assign(record, { [key!.toString()]: value }),
    {} as Record<keyof K, z.infer<(typeof schemas)[T]>>,
  );
}

async function _seed(
  model: ModelStatic<Model>,
  values: State,
  options: SeedOptions,
  records: State[],
  level: number,
) {
  const schema = schemas[model.name as schemas.Entities];
  if (schema && options.mock && schema instanceof ZodObject) {
    if (model.name === 'User' && !('tier' in values)) {
      values['tier'] = UserTierMap.ManuallyVerified;
    }
    if (model.name === 'Address' && !('is_banned' in values)) {
      values['is_banned'] = false;
    }
    if (model.name === 'Community') {
      if (!('tier' in values))
        values['tier'] = CommunityTierMap.ManuallyVerified;
      if (!('spam_tier_level' in values))
        values['spam_tier_level'] = DisabledCommunitySpamTier;
    }
    const mocked = generateMock(schema, {});
    // force undefined associations
    const undefs = {} as State;
    Object.entries(schema.shape).forEach(([key, value]) => {
      if (key !== 'id' && typeof values[key] === 'undefined') {
        if (model.associations[key]) {
          if (isArray(value)) undefs[key] = [];
          else undefs[key] = undefined;
        } else if (isNullable(value)) undefs[key] = null;
      }
      // super-randomize string pks to avoid CI failures
      if (model.primaryKeyAttribute === key && isString(value))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mocked as any)[key] = `${(mocked as any)[key]}-${randomInt(1000)}`;
    });
    // eslint-disable-next-line no-param-reassign
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
