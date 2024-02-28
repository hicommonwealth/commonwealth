import { FakerFunction, generateMock } from '@anatine/zod-mock';
import { Faker } from '@faker-js/faker';
import seedrandom from 'seedrandom';
import { Model, ModelStatic } from 'sequelize';
import z from 'zod';

const GENERATED_PROPS = [
  'id',
  'created_at',
  'updated_at',
  'createdAt',
  'updatedAt',
];

const rng = seedrandom('do-not-change');
const deterministicRandInt = (max?: number) => {
  return rng.quick() * (max || 1_000_000_000);
};

export type SchemaWithModel<T extends z.AnyZodObject> = {
  schema: T;
  mockDefaults?: () => Partial<z.infer<T>>;
  model: ModelStatic<Model>;
};

const mockeryMapper = (
  keyName: string,
  fakerInstance: Faker,
): FakerFunction | undefined => {
  const keyToFnMap: Record<string, FakerFunction> = {
    number: (
      options?:
        | number
        | {
            min?: number;
            max?: number;
          },
    ): number => {
      console.log('BOOM');
      return deterministicRandInt((options || ({} as any)).max);
    },
  };
  return keyName && keyName.toLowerCase() in keyToFnMap
    ? keyToFnMap[keyName.toLowerCase() as never]
    : undefined;
};

export async function seed<T extends SchemaWithModel<any>>(
  { schema, mockDefaults, model }: T,
  overrides: Partial<z.infer<T['schema']>> = {},
): Promise<Model<z.infer<T['schema']>>> {
  const mockData = generateMock(schema, {
    seed: 1,
    mockeryMapper,
  });
  for (const prop of GENERATED_PROPS) {
    delete mockData[prop];
  }
  const data = {
    ...mockData,
    ...mockDefaults?.(),
    ...overrides,
  };
  return model.create(data);
}
