import Chance from 'chance';
import RandExp from 'randexp';
import { z, type ZodType } from 'zod';

const chance = new Chance();

export function generateMockFromZod<T extends ZodType>(v: T): z.infer<T> {
  if (v instanceof z.ZodOptional)
    return generateMockFromZod(v.unwrap() as ZodType) as z.infer<T>;
  if (v instanceof z.ZodNullable) return generateMockFromZod(v.unwrap() as T);

  if (v instanceof z.ZodBoolean) return chance.bool() as z.infer<T>;
  if (v instanceof z.ZodDate) return chance.date() as z.infer<T>;
  if (v instanceof z.ZodEnum) return chance.pickone(v.options) as z.infer<T>;
  if (v instanceof z.ZodLiteral) return v.value as z.infer<T>;

  if (v instanceof z.ZodNumber) {
    if (v.format === 'safeint')
      return chance.integer({
        min: Math.min(v.minValue || 0, 0),
        max: Math.min(v.maxValue || 1000, 1000),
      }) as z.infer<T>;
    return chance.floating({
      min: 0,
      max: 1000,
      fixed: 2,
    }) as z.infer<T>;
  }

  if (v instanceof z.ZodString)
    return new RandExp(v._zod.pattern).gen() as z.infer<T>;

  if (v instanceof z.ZodObject) {
    const shape = v.shape as Record<string, ZodType>;
    const o: Record<string, any> = {};
    for (const key in shape) {
      o[key] = generateMockFromZod(shape[key]);
    }
    return o as z.infer<T>;
  }

  if (v instanceof z.ZodArray) {
    const min = (v as any).minLength ?? 0;
    const max = (v as any).maxLength ?? 3;
    const count = chance.integer({ min, max });
    return Array.from({ length: count }, () =>
      generateMockFromZod(v.element as ZodType),
    ) as z.infer<T>;
  }

  if (v instanceof z.ZodUnion)
    return generateMockFromZod(
      chance.pickone(v.options as ZodType[]),
    ) as z.infer<T>;

  return undefined as z.infer<T>;
}
