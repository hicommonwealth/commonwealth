import { getSchemaUtils } from '../builders/schema-utils';
import { maybeSkipValidation } from './maybeSkipValidation';
export function createIdentitySchemaCreator(schemaType, validate) {
  return () => {
    const baseSchema = {
      parse: validate,
      json: validate,
      getType: () => schemaType,
    };
    return Object.assign(
      Object.assign({}, maybeSkipValidation(baseSchema)),
      getSchemaUtils(baseSchema),
    );
  };
}
