import { generateMock } from '@anatine/zod-mock';
import { schemas } from '@hicommonwealth/core';
import { Model, ModelStatic } from 'sequelize';
import z from 'zod';

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

// incrementing seed number for each call to the `seed` function
// for deterministic randomness when the order of calls is preserved
let seedNum = 1;

type E = keyof typeof schemas;

export type SchemaWithModel<T extends z.AnyZodObject> = {
  schema: T;
  model: ModelStatic<Model>;
  mockDefaults?: () => Partial<z.infer<T>>;
  allowedGeneratedProps?: GeneratedProp[];
  buildQuery?: (data: z.infer<T>) => {
    where: Partial<z.infer<T>>;
  };
};

export type SeedOptions = {
  mock: boolean;
};

export async function seed<T extends SchemaWithModel<any>>(
  { schema, model, mockDefaults, allowedGeneratedProps }: T,
  overrides: Partial<z.infer<T['schema']>> = {},
  options: SeedOptions = { mock: true },
): Promise<Model<z.infer<T['schema']>>> {
  let data: Partial<z.infer<T['schema']>> = {};

  if (options?.mock) {
    const generatedMockData = generateMock(schema, {
      seed: seedNum++,
    });
    for (const prop of GENERATED_PROPS) {
      if (!allowedGeneratedProps?.includes(prop)) {
        delete generatedMockData[prop];
      }
    }
    data = {
      ...data,
      ...generatedMockData,
      ...(mockDefaults?.() || {}),
    };
  }

  data = {
    ...data,
    ...overrides,
  };

  // console.log(`data #${seedNum} [${model.name}]: `, data);
  return model.create(data as z.infer<T['schema']>);
}

// TODO: implement proper bulkCreate
export async function bulkSeed<T extends SchemaWithModel<any>>(
  params: T,
  allOverrides: Partial<z.infer<T['schema']>>[] = [],
  options?: SeedOptions,
): Promise<Model<z.infer<T['schema']>>[]> {
  const createdEntities: Model<z.infer<T['schema']>>[] = [];
  for (const overrides of allOverrides) {
    const entity = await seed(params, overrides, options);
    createdEntities.push(entity);
  }
  return createdEntities;
}
