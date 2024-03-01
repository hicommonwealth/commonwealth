import { generateMock } from '@anatine/zod-mock';
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

export type SchemaWithModel<T extends z.AnyZodObject> = {
  schema: T;
  model: ModelStatic<Model>;
  mockDefaults?: () => Partial<z.infer<T>>;
  allowedGeneratedProps?: GeneratedProp[];
  buildQuery?: (data: z.infer<T>) => {
    where: Partial<z.infer<T>>;
  };
};

export async function seed<T extends SchemaWithModel<any>>(
  { schema, model, mockDefaults, allowedGeneratedProps }: T,
  overrides: Partial<z.infer<T['schema']>> = {},
): Promise<Model<z.infer<T['schema']>>> {
  const mockData = generateMock(schema, {
    seed: seedNum++,
  });
  for (const prop of GENERATED_PROPS) {
    if (!allowedGeneratedProps?.includes(prop)) {
      delete mockData[prop];
    }
  }
  const data = {
    ...mockData,
    ...mockDefaults?.(),
    ...overrides,
  };

  console.log(`data #${seedNum} [${model.name}]: `, data);
  return model.create(data);
}
