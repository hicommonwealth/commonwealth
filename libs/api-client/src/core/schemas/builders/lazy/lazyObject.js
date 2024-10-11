import { getObjectUtils } from '../object';
import { getObjectLikeUtils } from '../object-like';
import { getSchemaUtils } from '../schema-utils';
import { constructLazyBaseSchema, getMemoizedSchema } from './lazy';

export function lazyObject(getter) {
  const baseSchema = Object.assign(
    Object.assign({}, constructLazyBaseSchema(getter)),
    {
      _getRawProperties: () => getMemoizedSchema(getter)._getRawProperties(),
      _getParsedProperties: () =>
        getMemoizedSchema(getter)._getParsedProperties(),
    },
  );
  return Object.assign(
    Object.assign(
      Object.assign(Object.assign({}, baseSchema), getSchemaUtils(baseSchema)),
      getObjectLikeUtils(baseSchema),
    ),
    getObjectUtils(baseSchema),
  );
}
