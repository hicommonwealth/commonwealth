import { SchemaType } from '../../Schema';
import { JsonError } from './JsonError';
import { ParseError } from './ParseError';
export function getSchemaUtils(schema) {
  return {
    optional: () => optional(schema),
    transform: (transformer) => transform(schema, transformer),
    parseOrThrow: (raw, opts) => {
      const parsed = schema.parse(raw, opts);
      if (parsed.ok) {
        return parsed.value;
      }
      throw new ParseError(parsed.errors);
    },
    jsonOrThrow: (parsed, opts) => {
      const raw = schema.json(parsed, opts);
      if (raw.ok) {
        return raw.value;
      }
      throw new JsonError(raw.errors);
    },
  };
}
/**
 * schema utils are defined in one file to resolve issues with circular imports
 */
export function optional(schema) {
  const baseSchema = {
    parse: (raw, opts) => {
      if (raw == null) {
        return {
          ok: true,
          value: undefined,
        };
      }
      return schema.parse(raw, opts);
    },
    json: (parsed, opts) => {
      if (
        (opts === null || opts === void 0 ? void 0 : opts.omitUndefined) &&
        parsed === undefined
      ) {
        return {
          ok: true,
          value: undefined,
        };
      }
      if (parsed == null) {
        return {
          ok: true,
          value: null,
        };
      }
      return schema.json(parsed, opts);
    },
    getType: () => SchemaType.OPTIONAL,
  };
  return Object.assign(
    Object.assign({}, baseSchema),
    getSchemaUtils(baseSchema),
  );
}
export function transform(schema, transformer) {
  const baseSchema = {
    parse: (raw, opts) => {
      const parsed = schema.parse(raw, opts);
      if (!parsed.ok) {
        return parsed;
      }
      return {
        ok: true,
        value: transformer.transform(parsed.value),
      };
    },
    json: (transformed, opts) => {
      const parsed = transformer.untransform(transformed);
      return schema.json(parsed, opts);
    },
    getType: () => schema.getType(),
  };
  return Object.assign(
    Object.assign({}, baseSchema),
    getSchemaUtils(baseSchema),
  );
}
