import { generateMock } from '@anatine/zod-mock';
import { DeepPartial, schemas } from '@hicommonwealth/core';
import { Entities } from 'core/src/schemas';
import { Model, ModelStatic } from 'sequelize';
import z from 'zod';
import { models } from '../database';

// props that are not mocked unless otherwise specified
// via `allowedGeneratedProps`
const GENERATED_PROPS = [
  'id',
  'created_at',
  'updated_at',
  'createdAt',
  'updatedAt',
  'deleted_at',
] as const;
type GeneratedProp = typeof GENERATED_PROPS[number];

/**
 * Seed options
 *
 * @param mock true to auto mock values in schemas
 * @param skip array of field names to remove from schemas when auto mocked
 */
export type SeedOptions = {
  mock: boolean;
  skip?: GeneratedProp[];
};

/**
 * Seeds aggregates for unit testing
 *
 * @param name the name of the entity
 * @param values custom seed values specific to the unit test
 * @param options seed options - defaults to mocking without skips
 * @returns tuple with main aggreate record and array of total records created
 */
export async function seed<T extends schemas.Aggregates>(
  name: T,
  values?: DeepPartial<z.infer<typeof schemas.entities[T]>>,
  options: SeedOptions = { mock: true },
): Promise<
  [z.infer<typeof schemas.entities[T]> | undefined, Record<string, any>[]]
> {
  const records: Record<string, any>[] = [];
  await _seed(models[name], values ?? {}, options, records);
  return [records.at(0) as any, records];
}

async function _seed(
  model: ModelStatic<Model>,
  values: Record<string, any>,
  options: SeedOptions,
  records: Record<string, any>[],
) {
  if (options.mock && schemas.entities[model.name as Entities]) {
    const mocked: Record<string, any> = generateMock(
      schemas.entities[model.name as Entities],
    );
    if (options.skip) for (const key in options.skip) delete mocked[key];
    values = {
      ...mocked,
      ...values,
    };
    //console.log('mocked', model.name, values);
  }
  //console.log(model.name, values);
  const record = await model.create(values);
  records.push(record.toJSON());

  if (typeof values === 'object') {
    for (const [key, value] of Object.entries(values)) {
      const association = model.associations[key];
      if (association && Array.isArray(value)) {
        for (const child of value) {
          await _seed(
            association.target,
            {
              ...child,
              [association.foreignKey]:
                record.dataValues[model.primaryKeyAttribute],
            },
            options,
            records,
          );
        }
      }
    }
  }
}
