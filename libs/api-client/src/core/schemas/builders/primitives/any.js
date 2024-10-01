import { SchemaType } from '../../Schema';
import { createIdentitySchemaCreator } from '../../utils/createIdentitySchemaCreator';
export const any = createIdentitySchemaCreator(SchemaType.ANY, (value) => ({
  ok: true,
  value,
}));
