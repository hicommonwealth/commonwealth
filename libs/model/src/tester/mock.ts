import Chance from 'chance';
import RandExp from 'randexp';
import { z, ZodEmail, ZodURL, ZodUUID, type ZodType } from 'zod';
import { $ZodCheckRegex } from 'zod/v4/core';

const chance = new Chance();

export function generateMockFromZod<T extends ZodType>(v: T): z.infer<T> {
  if (v instanceof z.ZodNullable) return null as z.infer<T>;
  if (v instanceof z.ZodOptional) return undefined as z.infer<T>;
  if (v instanceof z.ZodDefault) return generateMockFromZod(v.unwrap() as T);
  if (v instanceof z.ZodUnion)
    return generateMockFromZod(
      chance.pickone(v.options as ZodType[]),
    ) as z.infer<T>;

  if (v instanceof z.ZodObject) {
    const shape = v.shape as Record<string, ZodType>;
    const o: Record<string, unknown> = {};
    for (const key in shape) {
      o[key] = generateMockFromZod(shape[key]);
    }
    return o as z.infer<T>;
  }

  if (v instanceof z.ZodBoolean) return chance.bool() as z.infer<T>;
  if (v instanceof z.ZodDate) return chance.date() as z.infer<T>;
  if (v instanceof z.ZodEnum) return chance.pickone(v.options) as z.infer<T>;
  if (v instanceof z.ZodLiteral) return v.value as z.infer<T>;
  if (v instanceof z.ZodArray) return [] as z.infer<T>;

  if (v instanceof z.ZodNumber)
    return chance.integer({
      min: Math.min(v.minValue || 0, 0),
      max: Math.min(v.maxValue || 100_000_000, 100_000_000),
    }) as z.infer<T>;

  if (v instanceof z.ZodString) {
    const check = v._zod.def.checks?.at(0);
    if (check) {
      if (check instanceof ZodUUID) return chance.guid() as z.infer<T>;
      else if (check instanceof ZodEmail) return chance.email() as z.infer<T>;
      else if (check instanceof ZodURL) return chance.url() as z.infer<T>;
      else if (check instanceof $ZodCheckRegex)
        return new RandExp(check._zod.def.pattern).gen() as z.infer<T>;
    }
    return chance.name() as z.infer<T>;
  }

  return undefined as z.infer<T>;
}
