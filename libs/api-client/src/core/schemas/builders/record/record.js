import { SchemaType } from '../../Schema';
import { entries } from '../../utils/entries';
import { getErrorMessageForIncorrectType } from '../../utils/getErrorMessageForIncorrectType';
import { isPlainObject } from '../../utils/isPlainObject';
import { maybeSkipValidation } from '../../utils/maybeSkipValidation';
import { getSchemaUtils } from '../schema-utils';
export function record(keySchema, valueSchema) {
  const baseSchema = {
    parse: (raw, opts) => {
      return validateAndTransformRecord({
        value: raw,
        isKeyNumeric: keySchema.getType() === SchemaType.NUMBER,
        transformKey: (key) => {
          var _a;
          return keySchema.parse(
            key,
            Object.assign(Object.assign({}, opts), {
              breadcrumbsPrefix: [
                ...((_a =
                  opts === null || opts === void 0
                    ? void 0
                    : opts.breadcrumbsPrefix) !== null && _a !== void 0
                  ? _a
                  : []),
                `${key} (key)`,
              ],
            }),
          );
        },
        transformValue: (value, key) => {
          var _a;
          return valueSchema.parse(
            value,
            Object.assign(Object.assign({}, opts), {
              breadcrumbsPrefix: [
                ...((_a =
                  opts === null || opts === void 0
                    ? void 0
                    : opts.breadcrumbsPrefix) !== null && _a !== void 0
                  ? _a
                  : []),
                `${key}`,
              ],
            }),
          );
        },
        breadcrumbsPrefix:
          opts === null || opts === void 0 ? void 0 : opts.breadcrumbsPrefix,
      });
    },
    json: (parsed, opts) => {
      return validateAndTransformRecord({
        value: parsed,
        isKeyNumeric: keySchema.getType() === SchemaType.NUMBER,
        transformKey: (key) => {
          var _a;
          return keySchema.json(
            key,
            Object.assign(Object.assign({}, opts), {
              breadcrumbsPrefix: [
                ...((_a =
                  opts === null || opts === void 0
                    ? void 0
                    : opts.breadcrumbsPrefix) !== null && _a !== void 0
                  ? _a
                  : []),
                `${key} (key)`,
              ],
            }),
          );
        },
        transformValue: (value, key) => {
          var _a;
          return valueSchema.json(
            value,
            Object.assign(Object.assign({}, opts), {
              breadcrumbsPrefix: [
                ...((_a =
                  opts === null || opts === void 0
                    ? void 0
                    : opts.breadcrumbsPrefix) !== null && _a !== void 0
                  ? _a
                  : []),
                `${key}`,
              ],
            }),
          );
        },
        breadcrumbsPrefix:
          opts === null || opts === void 0 ? void 0 : opts.breadcrumbsPrefix,
      });
    },
    getType: () => SchemaType.RECORD,
  };
  return Object.assign(
    Object.assign({}, maybeSkipValidation(baseSchema)),
    getSchemaUtils(baseSchema),
  );
}
function validateAndTransformRecord({
  value,
  isKeyNumeric,
  transformKey,
  transformValue,
  breadcrumbsPrefix = [],
}) {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: [
        {
          path: breadcrumbsPrefix,
          message: getErrorMessageForIncorrectType(value, 'object'),
        },
      ],
    };
  }
  return entries(value).reduce(
    (accPromise, [stringKey, value]) => {
      // skip nullish keys
      if (value == null) {
        return accPromise;
      }
      const acc = accPromise;
      let key = stringKey;
      if (isKeyNumeric) {
        const numberKey = stringKey.length > 0 ? Number(stringKey) : NaN;
        if (!isNaN(numberKey)) {
          key = numberKey;
        }
      }
      const transformedKey = transformKey(key);
      const transformedValue = transformValue(value, key);
      if (acc.ok && transformedKey.ok && transformedValue.ok) {
        return {
          ok: true,
          value: Object.assign(Object.assign({}, acc.value), {
            [transformedKey.value]: transformedValue.value,
          }),
        };
      }
      const errors = [];
      if (!acc.ok) {
        errors.push(...acc.errors);
      }
      if (!transformedKey.ok) {
        errors.push(...transformedKey.errors);
      }
      if (!transformedValue.ok) {
        errors.push(...transformedValue.errors);
      }
      return {
        ok: false,
        errors,
      };
    },
    { ok: true, value: {} },
  );
}
