import { generateMock } from '@anatine/zod-mock';
import { Model, ModelStatic } from 'sequelize';
import z from 'zod';

const GENERATED_PROPS = [
  'id',
  'created_at',
  'updated_at',
  'createdAt',
  'updatedAt',
];

let seedNum = 1;

export type SchemaWithModel<T extends z.AnyZodObject> = {
  schema: T;
  mockDefaults?: () => Partial<z.infer<T>>;
  model: ModelStatic<Model>;
};

export async function seed<T extends SchemaWithModel<any>>(
  { schema, mockDefaults, model }: T,
  overrides: Partial<z.infer<T['schema']>> = {},
): Promise<Model<z.infer<T['schema']>>> {
  const mockData = generateMock(schema, {
    seed: seedNum++,
  });
  for (const prop of GENERATED_PROPS) {
    delete mockData[prop];
  }
  const data = {
    ...mockData,
    ...mockDefaults?.(),
    ...overrides,
  };
  console.log(`data #${seedNum} [${model.name}]: `, data);
  return model.create(data);
}
